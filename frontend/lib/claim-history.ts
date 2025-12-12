/**
 * Utility to fetch royalty claim history from Story Protocol on-chain events
 */

import { createPublicClient, http, type Address, isAddress, formatEther, decodeEventLog } from 'viem'
import { aeneid, StoryClient } from '@story-protocol/core-sdk'
import { getUserImages, getUserDerivatives, type Image, type Derivative } from './dashboard-api'

// IP Royalty Vault ABI - specifically the RevenueTokenClaimed event
// Event structure from Story Protocol SDK (no ipId in event, but we know it from the vault)
const REVENUE_TOKEN_CLAIMED_EVENT_ABI = [
  {
    type: 'event',
    anonymous: false,
    name: 'RevenueTokenClaimed',
    inputs: [
      { name: 'claimer', internalType: 'address', type: 'address', indexed: false },
      { name: 'token', internalType: 'address', type: 'address', indexed: false },
      { name: 'amount', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
  },
] as const

export interface ClaimHistoryEntry {
  ipId: Address
  claimer: Address
  token: Address
  amount: bigint
  amountFormatted: string
  blockNumber: bigint
  transactionHash: string
  timestamp: Date | null
  assetType: 'original' | 'derivative'
  assetId: number | null
}

/**
 * Extracts an IP address from either a URL or a direct address string
 */
function extractIpAddress(ip: string | null | undefined): Address | null {
  if (!ip) return null
  if (isAddress(ip)) return ip as Address
  const urlMatch = ip.match(/0x[a-fA-F0-9]{40}/)
  if (urlMatch && isAddress(urlMatch[0])) return urlMatch[0] as Address
  const hexMatch = ip.match(/0x[a-fA-F0-9]{40}/i)
  if (hexMatch && isAddress(hexMatch[0])) return hexMatch[0] as Address
  return null
}

/**
 * Fetches claim history for all IP assets owned by a user
 */
export async function fetchClaimHistory(
  walletAddress: string,
  client: StoryClient
): Promise<ClaimHistoryEntry[]> {
  try {
    const publicClient = createPublicClient({
      chain: aeneid,
      transport: http('https://aeneid.storyrpc.io'),
    })

    // Get all user's IP assets (from images and derivatives)
    const [images, derivatives] = await Promise.all([
      getUserImages(walletAddress),
      getUserDerivatives(walletAddress),
    ])

    // Collect all IP IDs
    const ipIds: Address[] = []
    const ipToAssetMap = new Map<Address, { type: 'original' | 'derivative'; id: number }>()

    images.forEach((image) => {
      const ipAddress = extractIpAddress(image.ip)
      if (ipAddress) {
        ipIds.push(ipAddress)
        ipToAssetMap.set(ipAddress, { type: 'original', id: image.id })
      }
    })

    derivatives.forEach((derivative) => {
      const ipAddress = extractIpAddress(derivative.derivative_ip_id)
      if (ipAddress) {
        ipIds.push(ipAddress)
        ipToAssetMap.set(ipAddress, { type: 'derivative', id: derivative.id })
      }
    })

    if (ipIds.length === 0) {
      return []
    }

    // Get the current block to limit search range (last 100k blocks, ~2 weeks on Aeneid)
    const currentBlock = await publicClient.getBlockNumber()
    const fromBlock = currentBlock > BigInt(100000) ? currentBlock - BigInt(100000) : BigInt(0)

    // Query RevenueTokenClaimed events for all IP IDs
    // We need to query each IP's royalty vault separately
    const allClaims: ClaimHistoryEntry[] = []

    for (const ipId of ipIds) {
      try {
        // Get the royalty vault address for this IP using the SDK
        const vaultAddress = await client.royalty.getRoyaltyVaultAddress(ipId)

        // Query RevenueTokenClaimed events from the vault
        // Each vault is specific to one IP, so all events from this vault are for this IP
        const logs = await publicClient.getLogs({
          address: vaultAddress,
          event: {
            type: 'event',
            anonymous: false,
            name: 'RevenueTokenClaimed',
            inputs: [
              { name: 'claimer', internalType: 'address', type: 'address', indexed: false },
              { name: 'token', internalType: 'address', type: 'address', indexed: false },
              { name: 'amount', internalType: 'uint256', type: 'uint256', indexed: false },
            ],
          },
          fromBlock: fromBlock,
          toBlock: 'latest',
        })

        for (const log of logs) {
          try {
            const decoded = decodeEventLog({
              abi: REVENUE_TOKEN_CLAIMED_EVENT_ABI,
              eventName: 'RevenueTokenClaimed',
              data: log.data,
              topics: log.topics,
            })

            if (decoded.eventName === 'RevenueTokenClaimed') {
              const assetInfo = ipToAssetMap.get(ipId) || { type: 'original' as const, id: null }
              
              // Get block timestamp
              let timestamp: Date | null = null
              try {
                const block = await publicClient.getBlock({ blockNumber: log.blockNumber })
                timestamp = new Date(Number(block.timestamp) * 1000)
              } catch {
                // Ignore timestamp errors
              }

              allClaims.push({
                ipId: ipId, // Use the IP ID we're querying (vault is specific to IP)
                claimer: decoded.args.claimer,
                token: decoded.args.token,
                amount: decoded.args.amount,
                amountFormatted: formatEther(decoded.args.amount),
                blockNumber: log.blockNumber,
                transactionHash: log.transactionHash,
                timestamp,
                assetType: assetInfo.type,
                assetId: assetInfo.id,
              })
            }
          } catch (decodeError) {
            console.error(`Error decoding log for IP ${ipId}:`, decodeError)
            // Continue with next log
          }
        }
      } catch (error) {
        console.error(`Error fetching claims for IP ${ipId}:`, error)
        // Continue with other IPs
      }
    }

    // Sort by block number (most recent first)
    allClaims.sort((a, b) => {
      if (b.blockNumber > a.blockNumber) return 1
      if (b.blockNumber < a.blockNumber) return -1
      return 0
    })

    return allClaims
  } catch (error) {
    console.error('Error fetching claim history:', error)
    throw error
  }
}

