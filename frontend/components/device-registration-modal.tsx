"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useWallet } from "@/contexts/wallet-context"
import { useSearchParams, useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X, CheckCircle2 } from "lucide-react"

interface DeviceDetail {
  key: string
  value: string
}

export function DeviceRegistrationModal() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { account } = useWallet()
  const [walletAddress, setWalletAddress] = useState<string>("")
  const [deviceDetails, setDeviceDetails] = useState<DeviceDetail[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registerStatus, setRegisterStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const address = searchParams.get("address")
    const details = searchParams.get("details")

    if (address || details) {
      setIsOpen(true)

      if (address) {
        setWalletAddress(address)
      }

      if (details) {
        try {
          const decoded = decodeURIComponent(details)
          const parsed = decoded
            .split("\n")
            .map((line) => {
              const [key, ...valueParts] = line.split(":")
              return {
                key: key.trim(),
                value: valueParts.join(":").trim(),
              }
            })
            .filter((item) => item.key && item.value)
          setDeviceDetails(parsed)
        } catch (error) {
          console.error("Error parsing device details:", error)
        }
      }
    }
  }, [searchParams])

  const handleClose = () => {
    setIsOpen(false)
    setRegisterStatus("idle")
    setErrorMessage("")
    setWalletAddress("")
    setDeviceDetails([])
    const params = new URLSearchParams(searchParams.toString())
    params.delete("address")
    params.delete("details")
    router.replace(`/dashboard?${params.toString()}`, { scroll: false })
  }

  const handleSuccessClose = () => {
    handleClose()
    router.push("/dashboard?view=devices")
  }

  const handleRegister = async () => {
    if (!walletAddress) {
      setErrorMessage("Wallet address is missing")
      setRegisterStatus("error")
      return
    }

    if (!account) {
      setErrorMessage("Please connect your wallet first")
      setRegisterStatus("error")
      return
    }

    setIsSubmitting(true)
    setRegisterStatus("idle")
    setErrorMessage("")

    try {
      const metadata = deviceDetails.map((d) => `${d.key}: ${d.value}`).join("\n")

      const response = await fetch("/api/submit-device", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet_address: walletAddress.toLowerCase(),
          metadata: metadata,
          owner_address: account.toLowerCase(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 409 || data.code === "DEVICE_EXISTS") {
          const errorMsg = "Device already exists"
          setErrorMessage(errorMsg)
          setRegisterStatus("error")
          alert("Device already exists")
          return
        } else {
          setErrorMessage(data.error || "Failed to register device")
        }
        throw new Error(data.error || "Failed to register device")
      }

      setRegisterStatus("success")
    } catch (error) {
      console.error("Error registering device:", error)
      setErrorMessage(error instanceof Error ? error.message : "Failed to register device")
      setRegisterStatus("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        showCloseButton={false}
        className="max-w-2xl border-white/10 bg-[#0a0a0a] text-white p-0 sm:rounded-2xl overflow-hidden my-12 max-h-[85vh] flex flex-col"
      >
        {registerStatus === "success" ? (
          <>
            <DialogHeader className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <DialogTitle className="font-inter text-xl font-light tracking-tight">
                  Device Registered Successfully
                </DialogTitle>
                <button
                  onClick={handleSuccessClose}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
            </DialogHeader>

            <div className="p-8 flex flex-col items-center justify-center text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center"
              >
                <CheckCircle2 className="size-10 text-green-400" />
              </motion.div>
              
              <div className="space-y-2">
                <h3 className="font-inter text-lg font-medium text-white">
                  Device Registration Complete
                </h3>
                <p className="font-inter text-sm text-white/60">
                  Your device has been successfully registered and is now available in your dashboard.
                </p>
              </div>

              <button
                onClick={handleSuccessClose}
                className="w-full px-4 py-2.5 rounded-lg font-inter text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors duration-200"
              >
                View My Devices
              </button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="font-inter text-xl font-light tracking-tight mb-1">
                    Device Registration
                  </DialogTitle>
                  <p className="font-inter text-xs text-white/50">
                    Review and register your device details
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
            </DialogHeader>

            <div className="p-4 space-y-3 overflow-y-auto scrollbar-hide flex-1 min-h-0">
              {walletAddress && (
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <label className="font-inter text-[10px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
                    Device Wallet Address
                  </label>
                  <code className="font-mono text-xs text-white/90 break-all block">
                    {walletAddress}
                  </code>
                </div>
              )}

              {deviceDetails.length > 0 && (
                <div>
                  <label className="font-inter text-[10px] font-medium text-white/50 uppercase tracking-wider mb-2 block">
                    Device Details
                  </label>
                  <div className="rounded-lg border border-white/10 overflow-hidden">
                    {deviceDetails.map((detail, index) => (
                      <div
                        key={index}
                        className={`p-2.5 flex justify-between items-start gap-3 ${
                          index < deviceDetails.length - 1 ? "border-b border-white/10" : ""
                        }`}
                      >
                        <span className="font-inter text-xs font-medium text-white/80 min-w-[120px]">
                          {detail.key}:
                        </span>
                        <span className="font-inter text-xs text-white/60 text-right flex-1 break-words">
                          {detail.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {registerStatus === "error" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 text-red-400 text-sm"
                >
                  ✗ {errorMessage || "Failed to register device"}
                </motion.div>
              )}

              {!walletAddress && (
                <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-2.5 text-yellow-400 text-sm">
                  Missing wallet address. Please use the registration URL with proper parameters.
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/10">
              <button
                onClick={handleRegister}
                disabled={isSubmitting || !walletAddress || !account}
                className="w-full px-4 py-2.5 rounded-lg font-inter text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:bg-white/10 disabled:text-white/40 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isSubmitting ? "Registering..." : "Register Device"}
              </button>
              {!account && (
                <p className="mt-2 text-center font-inter text-xs text-white/50">
                  Please connect your wallet to register this device
                </p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

