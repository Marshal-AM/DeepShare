/**
 * Royalty and revenue utilities for Story Protocol
 */

import { StoryClient, WIP_TOKEN_ADDRESS } from '@story-protocol/core-sdk'
import { Address, isAddress } from 'viem'

// Royalty Policy addresses from Story Protocol
export const RoyaltyPolicyLRP: Address = '0x9156e603C949481883B1d3355c6f1132D191fC41' as Address
export const RoyaltyPolicyLAP: Address = '0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E' as Address

/**
 * Extracts an IP address from either a URL or a direct address string
 */
function extractIpAddress(ip: string | null | undefined): Address | null {
  if (!ip) return null
  
  if (isAddress(ip)) {
    return ip as Address
  }
  
  const urlMatch = ip.match(/0x[a-fA-F0-9]{40}/)
  if (urlMatch && isAddress(urlMatch[0])) {
    return urlMatch[0] as Address
  }
  
  const hexMatch = ip.match(/0x[a-fA-F0-9]{40}/i)
  if (hexMatch && isAddress(hexMatch[0])) {
    return hexMatch[0] as Address
  }
  
  return null
}

/**
 * Claims all revenue for a single IP asset
 * This is used for claiming revenue from original assets or standalone derivatives
 */
export async function claimRevenueForIp(
  client: StoryClient,
  ipId: string | Address
): Promise<{ txHash: string; claimedTokens: any }> {
  const ipAddress = extractIpAddress(ipId)
  if (!ipAddress) {
    throw new Error(`Invalid IP address: ${ipId}`)
  }

  const result = await client.royalty.claimAllRevenue({
    ancestorIpId: ipAddress,
    claimer: ipAddress, // Claim to the IP Account itself
    currencyTokens: [WIP_TOKEN_ADDRESS],
    childIpIds: [], // No child IPs for standalone claims
    royaltyPolicies: [], // Empty for standalone claims
  })

  return {
    txHash: result.txHashes?.[0] || '',
    claimedTokens: result.claimedTokens || [],
  }
}

/**
 * Claims revenue for a parent IP asset, including revenue from child derivatives
 * This is used when a parent IP owner wants to claim revenue from their original asset
 * that has been used in derivatives
 */
export async function claimRevenueForParentWithChildren(
  client: StoryClient,
  parentIpId: string | Address,
  childIpIds: (string | Address)[]
): Promise<{ txHash: string; claimedTokens: any }> {
  const parentAddress = extractIpAddress(parentIpId)
  if (!parentAddress) {
    throw new Error(`Invalid parent IP address: ${parentIpId}`)
  }

  const childAddresses = childIpIds
    .map(extractIpAddress)
    .filter((addr): addr is Address => addr !== null)

  const result = await client.royalty.claimAllRevenue({
    ancestorIpId: parentAddress,
    claimer: parentAddress,
    currencyTokens: [WIP_TOKEN_ADDRESS],
    childIpIds: childAddresses, // Include child derivatives
    royaltyPolicies: [RoyaltyPolicyLRP], // Use LRP for parent-child relationships
  })

  return {
    txHash: result.txHashes?.[0] || '',
    claimedTokens: result.claimedTokens || [],
  }
}

/**
 * Transfers ERC20 tokens (like WIP) from IP Account to owner's wallet
 * This is useful after claiming revenue, as revenue is claimed to the IP Account by default
 */
export async function transferTokensFromIpAccount(
  client: StoryClient,
  ipId: string | Address,
  tokenAddress: Address,
  amount: bigint,
  targetAddress: Address
): Promise<{ txHash: string }> {
  const ipAddress = extractIpAddress(ipId)
  if (!ipAddress) {
    throw new Error(`Invalid IP address: ${ipId}`)
  }

  const result = await client.ipAccount.transferErc20({
    ipId: ipAddress,
    tokens: [
      {
        address: tokenAddress,
        amount: amount,
        target: targetAddress,
      },
    ],
  })

  return {
    txHash: result.txHash || '',
  }
}

