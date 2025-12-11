/**
 * Utility to fetch all license terms attached to an IP asset
 */

import { StoryClient } from '@story-protocol/core-sdk'
import { Address, isAddress } from 'viem'

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

export interface AttachedLicenseTerm {
  licenseTemplate: Address
  licenseTermsId: bigint
  licenseTerms: {
    transferable: boolean
    defaultMintingFee: bigint
    expiration: bigint
    commercialUse: boolean
    commercialAttribution: boolean
    commercialRevShare: number
    derivativesAllowed: boolean
    derivativesAttribution: boolean
    derivativesApproval: boolean
    derivativesReciprocal: boolean
    currency: Address
    uri: string
  }
}

/**
 * Fetches all license terms attached to an IP asset
 */
export async function fetchAttachedLicenseTerms(
  client: StoryClient,
  ipId: Address | string | null | undefined
): Promise<AttachedLicenseTerm[]> {
  try {
    // Extract the actual address from URL or string
    const extractedAddress = typeof ipId === 'string' 
      ? extractIpAddress(ipId)
      : ipId
    
    if (!extractedAddress) {
      throw new Error(`Invalid IP address: ${ipId}`)
    }
    
    const ipAddress = extractedAddress
    // Access the RPC client from the license client
    const rpcClient = (client.license as any).rpcClient
    const licenseRegistryClient = client.license.licenseRegistryReadOnlyClient
    const licenseRegistryAddr = licenseRegistryClient.address

    // Import ABI from the SDK's internal structure
    // Since it's not exported, we'll use the client's internal readContract method
    // We need to access the contract directly
    const licenseRegistryAbi = [
      {
        type: 'function',
        inputs: [{ name: 'ipId', internalType: 'address', type: 'address' }],
        name: 'getAttachedLicenseTermsCount',
        outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
        stateMutability: 'view',
      },
      {
        type: 'function',
        inputs: [
          { name: 'ipId', internalType: 'address', type: 'address' },
          { name: 'index', internalType: 'uint256', type: 'uint256' },
        ],
        name: 'getAttachedLicenseTerms',
        outputs: [
          { name: 'licenseTemplate', internalType: 'address', type: 'address' },
          { name: 'licenseTermsId', internalType: 'uint256', type: 'uint256' },
        ],
        stateMutability: 'view',
      },
    ] as const

    // Get the count of attached license terms
    const count = await rpcClient.readContract({
      abi: licenseRegistryAbi,
      address: licenseRegistryAddr,
      functionName: 'getAttachedLicenseTermsCount',
      args: [ipAddress],
    }) as bigint

    const attachedTerms: AttachedLicenseTerm[] = []

    // Fetch all attached license terms
    for (let i = BigInt(0); i < count; i++) {
      const result = await rpcClient.readContract({
        abi: licenseRegistryAbi,
        address: licenseRegistryAddr,
        functionName: 'getAttachedLicenseTerms',
        args: [ipAddress, i],
      }) as [Address, bigint]

      const [licenseTemplate, licenseTermsId] = result

      // Fetch the actual license terms details
      const licenseTermsDetails = await client.license.getLicenseTerms(Number(licenseTermsId))

      attachedTerms.push({
        licenseTemplate,
        licenseTermsId,
        licenseTerms: {
          transferable: licenseTermsDetails.terms.transferable,
          defaultMintingFee: licenseTermsDetails.terms.defaultMintingFee,
          expiration: licenseTermsDetails.terms.expiration,
          commercialUse: licenseTermsDetails.terms.commercialUse,
          commercialAttribution: licenseTermsDetails.terms.commercialAttribution,
          commercialRevShare: licenseTermsDetails.terms.commercialRevShare,
          derivativesAllowed: licenseTermsDetails.terms.derivativesAllowed,
          derivativesAttribution: licenseTermsDetails.terms.derivativesAttribution,
          derivativesApproval: licenseTermsDetails.terms.derivativesApproval,
          derivativesReciprocal: licenseTermsDetails.terms.derivativesReciprocal,
          currency: licenseTermsDetails.terms.currency,
          uri: licenseTermsDetails.terms.uri,
        },
      })
    }

    // Also include default license terms if not already in the list
    const defaultLicenseTerms = await licenseRegistryClient.getDefaultLicenseTerms()
    const hasDefault = attachedTerms.some(
      (term) => term.licenseTermsId === defaultLicenseTerms.licenseTermsId
    )

    if (!hasDefault && defaultLicenseTerms.licenseTermsId !== BigInt(0)) {
      const licenseTermsDetails = await client.license.getLicenseTerms(
        Number(defaultLicenseTerms.licenseTermsId)
      )

      attachedTerms.push({
        licenseTemplate: defaultLicenseTerms.licenseTemplate,
        licenseTermsId: defaultLicenseTerms.licenseTermsId,
        licenseTerms: {
          transferable: licenseTermsDetails.terms.transferable,
          defaultMintingFee: licenseTermsDetails.terms.defaultMintingFee,
          expiration: licenseTermsDetails.terms.expiration,
          commercialUse: licenseTermsDetails.terms.commercialUse,
          commercialAttribution: licenseTermsDetails.terms.commercialAttribution,
          commercialRevShare: licenseTermsDetails.terms.commercialRevShare,
          derivativesAllowed: licenseTermsDetails.terms.derivativesAllowed,
          derivativesAttribution: licenseTermsDetails.terms.derivativesAttribution,
          derivativesApproval: licenseTermsDetails.terms.derivativesApproval,
          derivativesReciprocal: licenseTermsDetails.terms.derivativesReciprocal,
          currency: licenseTermsDetails.terms.currency,
          uri: licenseTermsDetails.terms.uri,
        },
      })
    }

    return attachedTerms
  } catch (error: any) {
    console.error('Error fetching attached license terms:', error)
    throw error
  }
}

