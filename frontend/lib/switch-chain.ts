/**
 * Utility to switch MetaMask to Aeneid chain
 */

const AENEID_CHAIN_ID = '0x523' // 1315 in hex
const AENEID_CHAIN_ID_DECIMAL = 1315

const AENEID_CHAIN_CONFIG = {
  chainId: AENEID_CHAIN_ID,
  chainName: 'Aeneid',
  nativeCurrency: {
    name: 'IP',
    symbol: 'IP',
    decimals: 18,
  },
  rpcUrls: ['https://aeneid.storyrpc.io'],
  blockExplorerUrls: ['https://aeneid.storyscan.io'],
}

/**
 * Switches MetaMask to Aeneid chain
 * If the chain is not added, it will add it first
 */
export async function switchToAeneidChain(): Promise<void> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask is not installed')
  }

  try {
    // Check current chain
    const currentChainId = await window.ethereum.request({
      method: 'eth_chainId',
    })

    // If already on Aeneid, return
    if (currentChainId === AENEID_CHAIN_ID) {
      return
    }

    // Try to switch to Aeneid
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: AENEID_CHAIN_ID }],
      })
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        // Add the chain
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [AENEID_CHAIN_CONFIG],
        })
      } else {
        // Other error (e.g., user rejected)
        throw switchError
      }
    }
  } catch (error: any) {
    console.error('Error switching to Aeneid chain:', error)
    if (error.code === 4001) {
      throw new Error('User rejected chain switch. Please switch to Aeneid manually.')
    }
    throw new Error(`Failed to switch to Aeneid chain: ${error.message}`)
  }
}

