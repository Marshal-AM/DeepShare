"use client"

import { motion } from "framer-motion"
import { useWallet } from "@/contexts/wallet-context"
import { Wallet, Calendar, Hash } from "lucide-react"

function DetailCard({
  label,
  value,
  icon: Icon,
  delay = 0,
}: {
  label: string
  value: string
  icon: any
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-all duration-300"
    >
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/5 blur-3xl group-hover:bg-white/10 transition-colors duration-500" />
      
      <div className="relative z-10 flex items-start justify-between">
        <div className="space-y-1">
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          <p className="font-mono text-sm md:text-base break-all text-white/90">
            {value}
          </p>
        </div>
        <div className="p-2 rounded-lg bg-white/5 text-white/70 group-hover:text-white transition-colors">
          <Icon className="size-5" />
        </div>
      </div>
    </motion.div>
  )
}

export function MyDetails() {
  const { account, user } = useWallet()

  const formattedDate = user?.created_at 
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—"

  return (
    <div className="space-y-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="font-inter text-3xl md:text-4xl font-light tracking-tight mb-2">
          Account Overview
        </h2>
        <p className="text-muted-foreground font-inter font-light">
          Manage your personal information and account settings.
        </p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        <DetailCard
          label="Wallet Address"
          value={account || "—"}
          icon={Wallet}
          delay={0.1}
        />
        
        {user && (
          <>
            <DetailCard
              label="User ID"
              value={`#${user.id.toString().padStart(6, '0')}`}
              icon={Hash}
              delay={0.2}
            />
            
            <DetailCard
              label="Member Since"
              value={formattedDate}
              icon={Calendar}
              delay={0.3}
            />
          </>
        )}
      </div>
    </div>
  )
}
