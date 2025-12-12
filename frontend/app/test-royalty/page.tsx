"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/contexts/wallet-context"
import { createStoryClientFromWallet } from "@/lib/story-client"
import { fetchAttachedLicenseTerms } from "@/lib/fetch-license-terms"
import { getUserDerivatives, type Derivative } from "@/lib/dashboard-api"
import { getPinataImageUrl } from "@/lib/pinata"
import { formatEther, parseEther, isAddress, createPublicClient, http } from "viem"
import { Address } from "viem"
import { WIP_TOKEN_ADDRESS, aeneid } from "@story-protocol/core-sdk"
import { Loader2, CheckCircle2, AlertCircle, FileText, DollarSign, ExternalLink, Play, Layers, Image as ImageIcon } from "lucide-react"
import { Navbar } from "@/components/navbar"

interface LogEntry {
  timestamp: Date
  type: "info" | "success" | "error" | "warning"
  message: string
  txHash?: string
}

function formatMintingFee(fee: bigint): string {
  const formatted = formatEther(fee)
  return formatted.includes('.') ? formatted.replace(/\.?0+$/, '') : formatted
}

function formatRevenueShare(share: number): number {
  return share / 1_000_000
}

function extractIpAddress(ip: string | null | undefined): Address | null {
  if (!ip) return null
  if (isAddress(ip)) return ip as Address
  const urlMatch = ip.match(/0x[a-fA-F0-9]{40}/)
  if (urlMatch && isAddress(urlMatch[0])) return urlMatch[0] as Address
  const hexMatch = ip.match(/0x[a-fA-F0-9]{40}/i)
  if (hexMatch && isAddress(hexMatch[0])) return hexMatch[0] as Address
  return null
}

export default function TestRoyaltyPage() {
  const { account } = useWallet()
  const [derivatives, setDerivatives] = useState<Derivative[]>([])
  const [selectedDerivative, setSelectedDerivative] = useState<Derivative | null>(null)
  const [licenseTerms, setLicenseTerms] = useState<any[]>([])
  const [selectedLicenseTermsId, setSelectedLicenseTermsId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchingDerivatives, setFetchingDerivatives] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [mintingAmount, setMintingAmount] = useState("1")

  useEffect(() => {
    if (!account) return

    const loadDerivatives = async () => {
      setFetchingDerivatives(true)
      try {
        const data = await getUserDerivatives(account)
        setDerivatives(data)
        addLog("info", `Loaded ${data.length} derivative(s) from your account`)
      } catch (error: any) {
        addLog("error", `Failed to load derivatives: ${error.message}`)
      } finally {
        setFetchingDerivatives(false)
      }
    }

    loadDerivatives()
  }, [account])

  const addLog = (type: LogEntry["type"], message: string, txHash?: string) => {
    setLogs((prev) => [
      ...prev,
      {
        timestamp: new Date(),
        type,
        message,
        txHash,
      },
    ])
  }

  const handleSelectDerivative = (derivative: Derivative) => {
    setSelectedDerivative(derivative)
    setLicenseTerms([])
    setSelectedLicenseTermsId(null)
    addLog("info", `Selected derivative #${derivative.id}`)
  }

  const fetchLicenseTerms = async () => {
    if (!selectedDerivative?.derivative_ip_id) {
      addLog("error", "Please select a derivative first")
      return
    }

    setLoading(true)
    addLog("info", `Fetching license terms for derivative #${selectedDerivative.id}...`)

    try {
      const client = await createStoryClientFromWallet()
      const terms = await fetchAttachedLicenseTerms(client, selectedDerivative.derivative_ip_id)
      
      setLicenseTerms(terms)
      addLog("success", `Found ${terms.length} license term(s) available`)
      
      if (terms.length > 0) {
        setSelectedLicenseTermsId(Number(terms[0].licenseTermsId))
      }
    } catch (error: any) {
      addLog("error", `Failed to fetch license terms: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const simulateUsage = async () => {
    if (!account) {
      addLog("error", "Please connect your wallet")
      return
    }

    if (!selectedDerivative?.derivative_ip_id) {
      addLog("error", "Please select a derivative first")
      return
    }

    if (!selectedLicenseTermsId) {
      addLog("error", "Please select a license term")
      return
    }

    const amount = parseInt(mintingAmount) || 1
    if (amount < 1) {
      addLog("error", "Minting amount must be at least 1")
      return
    }

    setLoading(true)
    addLog("info", `Starting simulation: Minting ${amount} license token(s)...`)

    try {
      const client = await createStoryClientFromWallet()
      const derivativeAddress = extractIpAddress(selectedDerivative.derivative_ip_id)
      
      if (!derivativeAddress) {
        throw new Error("Invalid derivative IP address")
      }

      // Find the selected license term details
      const selectedTerm = licenseTerms.find(
        (t) => Number(t.licenseTermsId) === selectedLicenseTermsId
      )

      if (!selectedTerm) {
        throw new Error("Selected license term not found")
      }

      const mintingFee = selectedTerm.licenseTerms.defaultMintingFee
      const mintingFeeFormatted = formatMintingFee(mintingFee)
      const revenueShare = formatRevenueShare(selectedTerm.licenseTerms.commercialRevShare)

      addLog(
        "info",
        `License Details: Minting Fee: ${mintingFeeFormatted} $WIP, Revenue Share: ${revenueShare}%`
      )

      // Step 1: Mint License Tokens
      addLog("info", "Step 1: Minting license tokens from derivative...")
      addLog("warning", "This will require a MetaMask transaction approval")

      // Prepare minting parameters
      // Based on examples, maxMintingFee: BigInt(0) means "no limit" - SDK will handle fee automatically
      // The SDK will automatically wrap IP to WIP if needed
      const mintParams: any = {
        licenseTermsId: selectedLicenseTermsId,
        licensorIpId: derivativeAddress,
        amount: amount,
        maxMintingFee: BigInt(0), // 0 = no limit, SDK handles fee automatically
        maxRevenueShare: 100, // 100 = 100% (SDK expects percentage)
      }

      if (mintingFee === BigInt(0)) {
        addLog("info", "No minting fee required")
      } else {
        addLog("info", `Minting fee: ${mintingFeeFormatted} $WIP (will be paid automatically)`)
      }

      const mintResult = await client.license.mintLicenseTokens(mintParams)

      if (!mintResult.txHash) {
        throw new Error("Failed to get transaction hash from minting")
      }

      addLog("success", `License tokens minted successfully!`, mintResult.txHash)
      addLog(
        "info",
        `Paid ${mintingFeeFormatted} $WIP as minting fee to derivative owner`
      )

      if (mintResult.licenseTokenIds && mintResult.licenseTokenIds.length > 0) {
        addLog(
          "success",
          `Received ${mintResult.licenseTokenIds.length} license token(s): ${mintResult.licenseTokenIds.join(", ")}`
        )
      }

      // Step 2: Explain revenue flow
      addLog("info", "Step 2: Revenue Distribution")
      addLog(
        "info",
        `The minting fee (${mintingFeeFormatted} $WIP) has been sent to the derivative owner's IP Account royalty vault`
      )
      
      if (revenueShare > 0) {
        addLog(
          "info",
          `Future commercial revenue will include ${revenueShare}% royalty to the derivative owner`
        )
      }

      addLog("success", "Simulation completed successfully!")
      addLog(
        "info",
        "The derivative owner can now claim this revenue using the 'Claim All Revenue' button in their dashboard"
      )
    } catch (error: any) {
      addLog("error", `Simulation failed: ${error.message}`)
      console.error("Error simulating usage:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Navbar />
      <div className="pt-24 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="font-inter text-4xl font-light tracking-tight mb-2">
            Test Royalty Flow
          </h1>
          <p className="text-white/60 font-inter">
            Simulate a user minting license tokens to use a derivative asset
          </p>
        </div>

        {!account && (
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
            <p className="text-yellow-400 font-inter text-sm">
              Please connect your wallet to test the royalty flow
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* Derivatives Selection */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-inter text-lg font-medium">Your Derivatives</h3>
              <button
                onClick={async () => {
                  if (!account) return
                  setFetchingDerivatives(true)
                  try {
                    const data = await getUserDerivatives(account)
                    setDerivatives(data)
                    addLog("info", `Refreshed: ${data.length} derivative(s) found`)
                  } catch (error: any) {
                    addLog("error", `Failed to refresh: ${error.message}`)
                  } finally {
                    setFetchingDerivatives(false)
                  }
                }}
                disabled={fetchingDerivatives}
                className="px-3 py-1.5 rounded-lg font-inter text-xs font-medium text-white/70 bg-white/5 hover:bg-white/10 disabled:opacity-50 transition-colors"
              >
                Refresh
              </button>
            </div>

            {fetchingDerivatives ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-white/20" />
              </div>
            ) : derivatives.length === 0 ? (
              <div className="text-center py-8 text-white/50">
                <Layers className="size-12 mx-auto mb-3 opacity-20" />
                <p className="font-inter text-sm">No derivatives found</p>
                <p className="font-inter text-xs mt-1">Create derivatives from the marketplace first</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {derivatives.map((derivative) => {
                  const isSelected = selectedDerivative?.id === derivative.id
                  const imageUrl = derivative.image_cid ? getPinataImageUrl(derivative.image_cid) : null

                  return (
                    <button
                      key={derivative.id}
                      onClick={() => handleSelectDerivative(derivative)}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={`Derivative ${derivative.id}`}
                            className="w-16 h-16 rounded-lg object-cover shrink-0"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                            <Layers className="size-6 text-white/30" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-inter text-sm font-medium text-white">
                              Derivative #{derivative.id}
                            </h4>
                            {isSelected && (
                              <CheckCircle2 className="size-4 text-blue-400 shrink-0" />
                            )}
                          </div>
                          <p className="font-mono text-xs text-white/60 truncate">
                            {derivative.derivative_ip_id || "No IP ID"}
                          </p>
                          <p className="font-inter text-xs text-white/50 mt-1">
                            {new Date(derivative.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* License Terms Section */}
          {selectedDerivative && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-6 space-y-4">
              <div>
                <h3 className="font-inter text-lg font-medium mb-2">
                  Selected: Derivative #{selectedDerivative.id}
                </h3>
                <p className="font-mono text-xs text-white/60 break-all">
                  {selectedDerivative.derivative_ip_id}
                </p>
              </div>

              <button
                onClick={fetchLicenseTerms}
                disabled={loading || !selectedDerivative.derivative_ip_id}
                className="w-full px-4 py-2.5 rounded-lg font-inter text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:bg-white/10 disabled:text-white/40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Fetching...</span>
                  </>
                ) : (
                  <>
                    <FileText className="size-4" />
                    <span>Fetch License Terms</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* License Terms Selection */}
          {licenseTerms.length > 0 && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-6 space-y-4">
              <h3 className="font-inter text-lg font-medium">Available License Terms</h3>
              <div className="space-y-3">
                {licenseTerms.map((term) => {
                  const mintingFee = formatMintingFee(term.licenseTerms.defaultMintingFee)
                  const revenueShare = formatRevenueShare(term.licenseTerms.commercialRevShare)
                  const isSelected = Number(term.licenseTermsId) === selectedLicenseTermsId

                  return (
                    <button
                      key={Number(term.licenseTermsId)}
                      onClick={() => setSelectedLicenseTermsId(Number(term.licenseTermsId))}
                      className={`w-full p-4 rounded-lg border text-left transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="size-4 text-white/70" />
                            <h5 className="font-inter text-base font-medium text-white">
                              License Terms ID: {Number(term.licenseTermsId)}
                            </h5>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-1.5">
                              <DollarSign className="size-4 text-white/50" />
                              <span className="text-white/70">
                                Minting Fee: <span className="font-bold">{mintingFee}</span> $WIP
                              </span>
                            </div>
                            {revenueShare > 0 && (
                              <div className="flex items-center gap-1.5">
                                <DollarSign className="size-4 text-white/50" />
                                <span className="text-white/70">
                                  Revenue Share: <span className="font-bold">{revenueShare}%</span>
                                </span>
                              </div>
                            )}
                            <p className="text-white/60 text-xs mt-2">
                              Commercial: {term.licenseTerms.commercialUse ? "Yes" : "No"}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="size-5 text-blue-400 shrink-0 ml-2" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="pt-4 border-t border-white/10">
                <label className="block font-inter text-sm font-medium text-white/70 mb-2">
                  Number of License Tokens to Mint
                </label>
                <input
                  type="number"
                  value={mintingAmount}
                  onChange={(e) => setMintingAmount(e.target.value)}
                  min="1"
                  className="w-full px-4 py-2.5 rounded-lg bg-black/40 border border-white/10 text-white font-inter text-sm focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <button
                onClick={simulateUsage}
                disabled={loading || !selectedLicenseTermsId || !account}
                className="w-full px-4 py-3 rounded-lg font-inter text-sm font-medium text-white bg-green-500 hover:bg-green-600 disabled:bg-white/10 disabled:text-white/40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Play className="size-4" />
                    <span>Simulate Usage (Mint License Tokens)</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Logs Section */}
          {logs.length > 0 && (
            <div className="rounded-lg border border-white/10 bg-black/40 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-inter text-lg font-medium">Simulation Logs</h3>
                <button
                  onClick={() => setLogs([])}
                  className="px-3 py-1.5 rounded-lg font-inter text-xs font-medium text-white/70 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Clear Logs
                </button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-hide">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border text-sm ${
                      log.type === "success"
                        ? "border-green-500/30 bg-green-500/10 text-green-400"
                        : log.type === "error"
                        ? "border-red-500/30 bg-red-500/10 text-red-400"
                        : log.type === "warning"
                        ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                        : "border-white/10 bg-white/5 text-white/70"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {log.type === "success" ? (
                        <CheckCircle2 className="size-4 mt-0.5 shrink-0" />
                      ) : log.type === "error" ? (
                        <AlertCircle className="size-4 mt-0.5 shrink-0" />
                      ) : (
                        <div className="size-4 mt-0.5 shrink-0 rounded-full border-2 border-current" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-inter break-words">{log.message}</p>
                        {log.txHash && (
                          <a
                            href={`https://aeneid.storyscan.io/tx/${log.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-mono text-xs"
                          >
                            View Transaction <ExternalLink className="size-3" />
                          </a>
                        )}
                        <p className="mt-1 text-xs opacity-60">
                          {log.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  )
}

