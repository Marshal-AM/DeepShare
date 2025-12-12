"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useWallet } from "@/contexts/wallet-context"
import { createStoryClientFromWallet } from "@/lib/story-client"
import { fetchClaimHistory, type ClaimHistoryEntry } from "@/lib/claim-history"
import { ExternalLink, Calendar, Hash, DollarSign, Layers, Image as ImageIcon, Loader2 } from "lucide-react"
import { formatEther } from "viem"
import { WIP_TOKEN_ADDRESS } from "@story-protocol/core-sdk"

function ClaimCard({ claim, index }: { claim: ClaimHistoryEntry; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="rounded-lg border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            {claim.assetType === 'derivative' ? (
              <Layers className="size-5 text-purple-400" />
            ) : (
              <ImageIcon className="size-5 text-blue-400" />
            )}
            <div>
              <h4 className="font-inter text-base font-medium text-white">
                {claim.assetType === 'derivative' ? 'Derivative' : 'Original Asset'} 
                {claim.assetId && ` #${claim.assetId}`}
              </h4>
              <p className="font-mono text-xs text-white/60 mt-0.5">
                {claim.ipId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <DollarSign className="size-4 text-white/50" />
              <span className="text-white/70">
                Amount: <span className="font-bold text-white">{claim.amountFormatted}</span> $WIP
              </span>
            </div>
            {claim.timestamp && (
              <div className="flex items-center gap-1.5">
                <Calendar className="size-4 text-white/50" />
                <span className="text-white/70">
                  {claim.timestamp.toLocaleDateString()} {claim.timestamp.toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-white/10">
            <Hash className="size-3 text-white/40" />
            <a
              href={`https://aeneid.storyscan.io/tx/${claim.transactionHash}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              View Transaction <ExternalLink className="size-3" />
            </a>
            <span className="text-white/20">•</span>
            <a
              href={`https://aeneid.explorer.story.foundation/ipa/${claim.ipId}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              View IP Asset <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function ClaimHistory() {
  const { account } = useWallet()
  const [claims, setClaims] = useState<ClaimHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!account) return

    const loadClaimHistory = async () => {
      try {
        setLoading(true)
        setError(null)
        const client = await createStoryClientFromWallet()
        const data = await fetchClaimHistory(account, client)
        setClaims(data)
      } catch (err: any) {
        setError(err.message || "Failed to load claim history")
        console.error("Error fetching claim history:", err)
      } finally {
        setLoading(false)
      }
    }

    loadClaimHistory()
  }, [account])

  // Calculate total claimed
  const totalClaimed = claims.reduce((sum, claim) => {
    return sum + claim.amount
  }, BigInt(0))

  return (
    <div className="space-y-8 h-full flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="font-inter text-3xl md:text-4xl font-light tracking-tight mb-2">
          Claim History
        </h2>
        <p className="text-muted-foreground font-inter font-light">
          View your royalty revenue claims from Story Protocol
        </p>
      </motion.div>

      {loading && (
        <div className="flex flex-1 items-center justify-center min-h-[200px]">
          <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-blue-500 animate-spin" />
        </div>
      )}

      {error && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-lg border border-red-500/20 bg-red-500/10 p-4"
        >
          <p className="font-mono text-sm text-red-400">{error}</p>
        </motion.div>
      )}

      {!loading && !error && claims.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 py-20 text-center min-h-[300px]"
        >
          <div className="mb-4 rounded-full bg-white/5 p-4">
            <DollarSign className="size-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 font-medium text-white">No claims found</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Revenue claims you make will appear here
          </p>
        </motion.div>
      )}

      {!loading && !error && claims.length > 0 && (
        <>
          {/* Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-lg border border-white/10 bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-inter text-sm text-white/60 mb-1">Total Claimed</p>
                <p className="font-inter text-3xl font-light text-white">
                  {formatEther(totalClaimed)} $WIP
                </p>
              </div>
              <div className="text-right">
                <p className="font-inter text-sm text-white/60 mb-1">Total Claims</p>
                <p className="font-inter text-3xl font-light text-white">{claims.length}</p>
              </div>
            </div>
          </motion.div>

          {/* Claims List */}
          <div className="space-y-4">
            {claims.map((claim, index) => (
              <ClaimCard key={`${claim.transactionHash}-${index}`} claim={claim} index={index} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

