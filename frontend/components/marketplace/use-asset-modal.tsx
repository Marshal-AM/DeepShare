"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useWallet } from "@/contexts/wallet-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X, Loader2, CheckCircle2, AlertCircle, Wallet, FileText, DollarSign } from "lucide-react"
import { type MarketplaceAsset } from "@/lib/dashboard-api"
import { createStoryClientFromWallet, SPGNFTContractAddress, NonCommercialSocialRemixingTermsId } from "@/lib/story-client"
import { uploadJSONToIPFS, getIPFSUrl } from "@/lib/ipfs"
import { fetchAttachedLicenseTerms } from "@/lib/fetch-license-terms"
import { StoryClient, IpMetadata, PILFlavor, WIP_TOKEN_ADDRESS } from '@story-protocol/core-sdk'
import { Address, parseEther, formatEther, isAddress } from 'viem'

/**
 * Extracts an IP address from either a URL or a direct address string
 */
function extractIpAddress(ip: string | null | undefined): Address | null {
  if (!ip) return null
  
  // If it's already a valid address, return it
  if (isAddress(ip)) {
    return ip as Address
  }
  
  // If it's a URL, try to extract the address from it
  // Pattern: https://aeneid.explorer.story.foundation/ipa/0x...
  const urlMatch = ip.match(/0x[a-fA-F0-9]{40}/)
  if (urlMatch && isAddress(urlMatch[0])) {
    return urlMatch[0] as Address
  }
  
  // Try to find any hex address pattern
  const hexMatch = ip.match(/0x[a-fA-F0-9]{40}/i)
  if (hexMatch && isAddress(hexMatch[0])) {
    return hexMatch[0] as Address
  }
  
  return null
}

/**
 * Converts defaultMintingFee from wei (bigint) to human-readable WIP tokens
 * @param feeInWei - The minting fee in wei (18 decimals)
 * @returns Formatted string with the fee in WIP tokens
 */
function formatMintingFee(feeInWei: bigint): string {
  // formatEther converts from wei (18 decimals) to ether/WIP tokens
  const feeInWip = formatEther(feeInWei)
  // Remove trailing zeros and unnecessary decimals
  return parseFloat(feeInWip).toString()
}

/**
 * Converts commercialRevShare from SDK format to percentage
 * SDK stores: 100% = 100_000_000 (1_000_000 per 1%)
 * @param revShare - The revenue share in SDK format (e.g., 15000000 = 15%)
 * @returns The percentage as a number (e.g., 15)
 */
function formatRevenueShare(revShare: number): number {
  // Convert from SDK format (100_000_000 = 100%) to percentage
  return revShare / 1_000_000
}

interface UseAssetModalProps {
  asset: MarketplaceAsset | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: (derivativeIpId: string, txHash: string) => void
}

interface LicenseOption {
  id: number
  name: string
  description: string
  mintingFee: string
  royaltyPercent: number
  commercial: boolean
}

export function UseAssetModal({ asset, isOpen, onClose, onSuccess }: UseAssetModalProps) {
  const { account } = useWallet()
  const [step, setStep] = useState<"select" | "processing" | "success" | "error">("select")
  const [selectedLicense, setSelectedLicense] = useState<LicenseOption | null>(null)
  const [error, setError] = useState<string>("")
  const [derivativeIpId, setDerivativeIpId] = useState<string>("")
  const [txHash, setTxHash] = useState<string>("")

  const [licenseOptions, setLicenseOptions] = useState<LicenseOption[]>([])

  // Fetch available license terms for the parent IP
  useEffect(() => {
    if (!asset?.ip || !isOpen) return

    const fetchLicenseTerms = async () => {
      try {
        const client = await createStoryClientFromWallet()
        const attachedTerms = await fetchAttachedLicenseTerms(client, asset.ip)
        
        // Convert to LicenseOption format
        const options: LicenseOption[] = attachedTerms.map((term) => {
          const mintingFeeFormatted = formatMintingFee(term.licenseTerms.defaultMintingFee)
          const royaltyPercentFormatted = formatRevenueShare(term.licenseTerms.commercialRevShare)
          
          return {
            id: Number(term.licenseTermsId),
            name: term.licenseTerms.commercialUse 
              ? 'Commercial License' 
              : 'Non-Commercial Social Remixing',
            description: term.licenseTerms.commercialUse
              ? `Commercial use with ${royaltyPercentFormatted}% revenue share`
              : 'Free to use for non-commercial derivative works',
            mintingFee: mintingFeeFormatted,
            royaltyPercent: royaltyPercentFormatted,
            commercial: term.licenseTerms.commercialUse,
          }
        })
        
        setLicenseOptions(options.length > 0 ? options : [
          {
            id: NonCommercialSocialRemixingTermsId,
            name: "Non-Commercial Social Remixing",
            description: "Free to use for non-commercial derivative works",
            mintingFee: "0",
            royaltyPercent: 0,
            commercial: false,
          },
        ])
      } catch (error) {
        console.error('Error fetching license terms:', error)
        // Fallback to default
        setLicenseOptions([
          {
            id: NonCommercialSocialRemixingTermsId,
            name: "Non-Commercial Social Remixing",
            description: "Free to use for non-commercial derivative works",
            mintingFee: "0",
            royaltyPercent: 0,
            commercial: false,
          },
        ])
      }
    }

    fetchLicenseTerms()
  }, [asset, isOpen])


  useEffect(() => {
    if (!isOpen) {
      setStep("select")
      setSelectedLicense(null)
      setError("")
      setDerivativeIpId("")
      setTxHash("")
    }
  }, [isOpen])

  const handleUseAsset = async () => {
    if (!asset || !account || !selectedLicense) {
      setError("Please select a license option")
      return
    }

    if (!asset.ip) {
      setError("This asset does not have an IP ID. It may not be registered on Story Protocol yet.")
      return
    }

    setStep("processing")
    setError("")

    try {
      // Step 1: Create Story Protocol client with user's wallet
      const client = await createStoryClientFromWallet()

      // Step 2: Generate IP metadata
      const ipMetadata: IpMetadata = client.ipAsset.generateIpMetadata({
        title: `Derivative of Asset #${asset.id}`,
        description: `A derivative work created from marketplace asset #${asset.id}. Original asset owned by ${asset.device?.owner_address || 'Unknown'}.`,
        createdAt: Math.floor(Date.now() / 1000).toString(),
        creators: [
          {
            name: 'Derivative Creator',
            address: account as Address,
            contributionPercent: 100,
          },
        ],
        image: asset.image_cid ? getIPFSUrl(asset.image_cid) : undefined,
      })

      // Step 3: Generate NFT metadata
      const nftMetadata = {
        name: `Derivative Asset #${asset.id}`,
        description: `Derivative NFT representing usage rights for marketplace asset #${asset.id}`,
        image: asset.image_cid ? getIPFSUrl(asset.image_cid) : undefined,
        attributes: [
          {
            key: 'Parent Asset ID',
            value: asset.id.toString(),
          },
          {
            key: 'License Type',
            value: selectedLicense.commercial ? 'Commercial' : 'Non-Commercial',
          },
          {
            key: 'Original Owner',
            value: asset.device?.owner_address || 'Unknown',
          },
        ],
      }

      // Step 4: Upload metadata to IPFS
      const [ipIpfsHash, nftIpfsHash] = await Promise.all([
        uploadJSONToIPFS(ipMetadata),
        uploadJSONToIPFS(nftMetadata),
      ])

      // Step 5: Create metadata hashes (using Web Crypto API for browser compatibility)
      const ipMetadataString = JSON.stringify(ipMetadata)
      const nftMetadataString = JSON.stringify(nftMetadata)
      
      const ipHashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ipMetadataString))
      const nftHashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(nftMetadataString))
      
      const ipHash = Array.from(new Uint8Array(ipHashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
      const nftHash = Array.from(new Uint8Array(nftHashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      // Step 6: Register derivative IP asset
      const parentIpAddress = extractIpAddress(asset.ip)
      if (!parentIpAddress) {
        throw new Error('Invalid IP address in asset')
      }
      
      const derivative = await client.ipAsset.registerDerivativeIpAsset({
        nft: { type: 'mint', spgNftContract: SPGNFTContractAddress },
        derivData: {
          parentIpIds: [parentIpAddress],
          licenseTermsIds: [selectedLicense.id],
        },
        ipMetadata: {
          ipMetadataURI: getIPFSUrl(ipIpfsHash),
          ipMetadataHash: `0x${ipHash}`,
          nftMetadataURI: getIPFSUrl(nftIpfsHash),
          nftMetadataHash: `0x${nftHash}`,
        },
      })

      if (!derivative.ipId || !derivative.txHash) {
        throw new Error('Failed to get derivative IP ID or transaction hash')
      }

      setDerivativeIpId(derivative.ipId)
      setTxHash(derivative.txHash)
      setStep("success")

      // Step 7: Store derivative in database
      try {
        const response = await fetch('/api/story/store-derivative', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parentAssetId: asset.id,
            parentIpId: asset.ip,
            derivativeIpId: derivative.ipId,
            txHash: derivative.txHash,
            userAddress: account,
            imageCid: asset.image_cid,
            metadataCid: asset.metadata_cid,
            ipMetadataCid: ipIpfsHash,
            nftMetadataCid: nftIpfsHash,
            licenseTermsId: selectedLicense.id,
          }),
        })

        if (!response.ok) {
          console.error('Failed to store derivative in database')
        }
      } catch (dbError) {
        console.error('Error storing derivative:', dbError)
        // Don't fail the flow if DB insert fails
      }

      if (onSuccess && derivative.ipId && derivative.txHash) {
        onSuccess(derivative.ipId, derivative.txHash)
      }
    } catch (err: any) {
      console.error('Error using asset:', err)
      setError(err.message || 'Failed to register derivative')
      setStep("error")
    }
  }

  const handleDialogChange = (open: boolean) => {
    // Prevent closing when in success state - user must click the close button
    if (!open && step === "success") {
      return
    }
    // Allow closing in other states
    if (!open) {
      onClose()
    }
  }

  if (!asset) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent 
        className="max-w-2xl border-white/10 bg-[#0a0a0a] text-white p-0 sm:rounded-2xl overflow-hidden"
        showCloseButton={false}
        onPointerDownOutside={(e) => {
          // Prevent closing on outside click when in success state
          if (step === "success") {
            e.preventDefault()
          }
        }}
        onInteractOutside={(e) => {
          // Prevent closing on outside interaction when in success state
          if (step === "success") {
            e.preventDefault()
          }
        }}
        onEscapeKeyDown={(e) => {
          // Prevent closing on ESC when in success state
          if (step === "success") {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="font-inter text-xl font-light tracking-tight">
                Use Asset #{asset.id}
              </DialogTitle>
              <p className="font-inter text-sm text-white/50 mt-1">
                Create a derivative work and pay royalties to the owner
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {step === "select" && (
            <>
              <div className="space-y-4">
                <h4 className="font-inter text-sm uppercase tracking-wider text-white/50 font-medium">
                  Select License Type
                </h4>
                <div className="space-y-3">
                  {licenseOptions.map((license) => (
                    <motion.button
                      key={license.id}
                      onClick={() => setSelectedLicense(license)}
                      className={`w-full p-4 rounded-lg border transition-all text-left ${
                        selectedLicense?.id === license.id
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="size-4 text-white/70" />
                            <h5 className="font-inter text-base font-medium text-white">
                              {license.name}
                            </h5>
                          </div>
                          <p className="font-inter text-sm text-white/60 mb-3">
                            {license.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1.5">
                              <DollarSign className="size-4 text-white/50" />
                              <span className="text-white/70">
                                Minting Fee: <span className="font-bold">{license.mintingFee}</span> $WIP
                              </span>
                            </div>
                            {license.royaltyPercent > 0 && (
                              <div className="flex items-center gap-1.5">
                                <Wallet className="size-4 text-white/50" />
                                <span className="text-white/70">
                                  Royalty: <span className="font-bold">{license.royaltyPercent}%</span>
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        {selectedLicense?.id === license.id && (
                          <CheckCircle2 className="size-5 text-blue-400 shrink-0 ml-2" />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {!account && (
                <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
                  <p className="font-inter text-sm text-yellow-400">
                    Please connect your wallet to use this asset
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-lg font-inter text-sm font-medium text-white/70 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUseAsset}
                  disabled={!selectedLicense || !account}
                  className="flex-1 px-4 py-2.5 rounded-lg font-inter text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:bg-white/10 disabled:text-white/40 disabled:cursor-not-allowed transition-colors"
                >
                  Use Asset
                </button>
              </div>
            </>
          )}

          {step === "processing" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="size-12 animate-spin text-blue-400" />
              <p className="font-inter text-base text-white/70">
                Registering derivative asset...
              </p>
              <p className="font-inter text-sm text-white/50">
                Please confirm the transaction in your wallet
              </p>
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center"
              >
                <CheckCircle2 className="size-10 text-green-400" />
              </motion.div>
              <div className="text-center space-y-2">
                <h3 className="font-inter text-lg font-medium text-white">
                  Derivative Created Successfully!
                </h3>
                <p className="font-inter text-sm text-white/60">
                  Your derivative IP asset has been registered
                </p>
              </div>
              <div className="w-full space-y-3">
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="font-inter text-xs text-white/50 mb-1">Derivative IP ID</p>
                  <p className="font-mono text-sm text-white break-all">{derivativeIpId}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="font-inter text-xs text-white/50 mb-1">Transaction Hash</p>
                  <a
                    href={`https://aeneid.storyscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-sm text-blue-400 hover:text-blue-300 break-all"
                  >
                    {txHash}
                  </a>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full px-4 py-2.5 rounded-lg font-inter text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {step === "error" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <AlertCircle className="size-12 text-red-400" />
              <div className="text-center space-y-2">
                <h3 className="font-inter text-lg font-medium text-white">
                  Error Creating Derivative
                </h3>
                <p className="font-inter text-sm text-red-400">{error}</p>
              </div>
              <button
                onClick={() => setStep("select")}
                className="px-4 py-2.5 rounded-lg font-inter text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

