"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from "react"
import { ensureUser, type User } from "@/lib/user-auth"
import { switchToAeneidChain } from "@/lib/switch-chain"

interface WalletContextType {
  isConnected: boolean
  account: string | null
  user: User | null
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  isLoading: boolean
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [account, setAccount] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const hasCheckedUser = useRef<Set<string>>(new Set())

  // Function to check/create user in Supabase
  const checkAndCreateUser = useCallback(async (walletAddress: string) => {
    // Only check once per wallet address to avoid duplicate calls
    if (hasCheckedUser.current.has(walletAddress.toLowerCase())) {
      return
    }

    try {
      hasCheckedUser.current.add(walletAddress.toLowerCase())
      const userData = await ensureUser(walletAddress)
      setUser(userData)
    } catch (error) {
      console.error("Error ensuring user:", error)
      // Don't block the user from using the app if Supabase fails
      // Just log the error
    }
  }, [])

  useEffect(() => {
    // Check if wallet is already connected
    const checkConnection = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" })
          if (accounts.length > 0) {
            // Switch to Aeneid if connected
            try {
              await switchToAeneidChain()
            } catch (error) {
              console.error("Error switching to Aeneid chain:", error)
              // Don't block connection if chain switch fails
            }
            
            const walletAddress = accounts[0]
            setAccount(walletAddress)
            setIsConnected(true)
            // Check/create user in Supabase
            await checkAndCreateUser(walletAddress)
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error)
        }
      }
      setIsLoading(false)
    }

    checkConnection()

    // Listen for account changes
    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = async (accounts: string[]) => {
        // Reset checked users when account changes
        hasCheckedUser.current.clear()
        setUser(null)

        if (accounts.length === 0) {
          setIsConnected(false)
          setAccount(null)
        } else {
          // Switch to Aeneid when account changes
          try {
            await switchToAeneidChain()
          } catch (error) {
            console.error("Error switching to Aeneid chain:", error)
          }
          
          const walletAddress = accounts[0]
          setAccount(walletAddress)
          setIsConnected(true)
          // Check/create user in Supabase
          await checkAndCreateUser(walletAddress)
        }
      }

      window.ethereum.on("accountsChanged", handleAccountsChanged)

      return () => {
        window.ethereum?.removeListener("accountsChanged", handleAccountsChanged)
      }
    }
  }, [checkAndCreateUser])

  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("Please install MetaMask to connect your wallet")
      return
    }

    try {
      setIsLoading(true)
      
      // Switch to Aeneid chain before connecting
      await switchToAeneidChain()
      
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })
      if (accounts.length > 0) {
        const walletAddress = accounts[0]
        setAccount(walletAddress)
        setIsConnected(true)
        // Check/create user in Supabase
        await checkAndCreateUser(walletAddress)
      }
    } catch (error: any) {
      console.error("Error connecting wallet:", error)
      if (error.code === 4001) {
        alert("Please connect to MetaMask")
      } else {
        alert(error.message || "Error connecting wallet. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const disconnectWallet = () => {
    setIsConnected(false)
    setAccount(null)
    setUser(null)
    hasCheckedUser.current.clear()
  }

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        account,
        user,
        connectWallet,
        disconnectWallet,
        isLoading,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      on: (event: string, handler: (accounts: string[]) => void) => void
      removeListener: (event: string, handler: (accounts: string[]) => void) => void
      isMetaMask?: boolean
    }
  }
}

