"use client"

import type React from "react"
import { useWallet } from "@/contexts/wallet-context"
import { WalletConnectScreen } from "./wallet-connect-screen"

export function WalletGate({ children }: { children: React.ReactNode }) {
  const { isConnected, isLoading } = useWallet()

  if (isLoading) {
    return (
      <div className="relative h-screen w-full overflow-hidden bg-[#050505] flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    )
  }

  if (!isConnected) {
    return <WalletConnectScreen />
  }

  return <>{children}</>
}

