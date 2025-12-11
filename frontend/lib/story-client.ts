/**
 * Client-side Story Protocol SDK utilities
 * Uses MetaMask wallet for transactions
 */

import { StoryClient, StoryConfig, aeneid } from '@story-protocol/core-sdk'
import { createWalletClient, custom, http, type Address } from 'viem'
import { toAccount } from 'viem/accounts'
import { switchToAeneidChain } from './switch-chain'

const SPGNFTContractAddress = '0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc' as Address
export const NonCommercialSocialRemixingTermsId = 1

/**
 * Create a Story Protocol client using MetaMask wallet
 */
export async function createStoryClientFromWallet(): Promise<StoryClient> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask is not installed')
  }

  // Switch to Aeneid chain first
  await switchToAeneidChain()

  // Get accounts from MetaMask
  let accounts = await window.ethereum.request({ method: 'eth_accounts' })
  if (accounts.length === 0) {
    // Request access if no accounts
    accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    if (accounts.length === 0) {
      throw new Error('No account found. Please connect your wallet.')
    }
  }

  const accountAddress = accounts[0] as Address

  // Create a JsonRpcAccount from the address
  // This tells viem to use JSON-RPC methods (eth_sendTransaction, etc.) for signing
  // which MetaMask will handle
  const account = toAccount(accountAddress)

  // Create wallet client with MetaMask transport, account, and chain
  // The account property is required for the SDK to work properly
  // The chain is required for viem to know which network to use
  const walletClient = createWalletClient({
    account,
    chain: aeneid, // Use the aeneid chain from SDK
    transport: custom(window.ethereum),
  })

  // Create Story Protocol config with wallet client
  // This ensures MetaMask is used for all transactions and the account property is set
  const config: StoryConfig = {
    wallet: walletClient,
    transport: http('https://aeneid.storyrpc.io'),
    chainId: 'aeneid' as any,
  }

  return StoryClient.newClient(config)
}

export { SPGNFTContractAddress }

