/**
 * Server-side Story Protocol client utilities
 * Note: For client-side, use createStoryClientFromWallet from lib/story-client.ts
 */

import { StoryClient, StoryConfig, aeneid } from '@story-protocol/core-sdk'
import { http, type Address } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

// For server-side operations, we'll use a service account
export function createStoryClient(account?: any): StoryClient {
  if (!account && !process.env.STORY_SERVICE_PRIVATE_KEY) {
    throw new Error('STORY_SERVICE_PRIVATE_KEY is required for server-side operations')
  }

  const config: StoryConfig = {
    account: account || privateKeyToAccount(`0x${process.env.STORY_SERVICE_PRIVATE_KEY || ''}` as Address),
    transport: http(process.env.NEXT_PUBLIC_STORY_RPC_URL || 'https://aeneid.storyrpc.io'),
    chainId: aeneid as any,
  }
  return StoryClient.newClient(config)
}

