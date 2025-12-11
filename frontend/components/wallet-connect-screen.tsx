"use client"

import { motion } from "framer-motion"
import { SentientSphere } from "./sentient-sphere"
import { useWallet } from "@/contexts/wallet-context"

export function WalletConnectScreen() {
  const { connectWallet, isLoading } = useWallet()

  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#050505]">
      {/* 3D Sphere Background */}
      <div className="absolute inset-0">
        <SentientSphere />
      </div>

      {/* Centered Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center"
        >
          <h1 className="font-sans text-5xl md:text-7xl lg:text-8xl font-light tracking-tight mb-12">
            DeepShare
          </h1>
          <motion.button
            onClick={connectWallet}
            disabled={isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative px-8 py-4 border border-white/20 rounded-full font-mono text-sm tracking-widest uppercase bg-transparent backdrop-blur-sm hover:bg-white hover:text-black transition-colors duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Connecting..." : "Connect Wallet"}
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#2563eb] rounded-full animate-pulse" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}

