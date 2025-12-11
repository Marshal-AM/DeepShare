"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useWallet } from "@/contexts/wallet-context"
import { getUserDevices, type Device } from "@/lib/dashboard-api"
import { Cpu, Hash, Calendar, Wallet, Monitor, HardDrive, Network, Globe } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter, useSearchParams } from "next/navigation"

/**
 * Parse metadata string into key-value pairs
 */
function parseMetadata(metadata: string | null): Record<string, string> | null {
  if (!metadata) return null

  try {
    // Try JSON first
    return JSON.parse(metadata)
  } catch {
    // If not JSON, parse as key: value format
    const lines = metadata.split('\n').filter(line => line.trim())
    const parsed: Record<string, string> = {}
    
    for (const line of lines) {
      const colonIndex = line.indexOf(':')
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim()
        const value = line.substring(colonIndex + 1).trim()
        if (key && value) {
          parsed[key] = value
        }
      }
    }
    
    return Object.keys(parsed).length > 0 ? parsed : null
  }
}

function DeviceCard({ 
  device, 
  index, 
  onClick 
}: { 
  device: Device
  index: number
  onClick: () => void
}) {
  const metadata = parseMetadata(device.metadata)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onClick={onClick}
      className="group relative flex flex-col justify-between rounded-xl border border-white/10 bg-white/5 p-6 hover:border-white/20 hover:bg-white/10 transition-all duration-300 cursor-pointer"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
              <Cpu className="size-5" />
            </div>
            <div>
              <p className="font-inter text-sm text-muted-foreground uppercase tracking-wider">
                Device ID
              </p>
              <p className="font-inter text-base font-medium text-white">#{device.id}</p>
            </div>
          </div>
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Wallet className="size-5 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-inter text-sm uppercase tracking-wider mb-1 text-white/50">Wallet</p>
              <p className="font-mono text-sm truncate text-white/90">
                {device.wallet_address || "—"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Calendar className="size-5 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-inter text-sm uppercase tracking-wider mb-1 text-white/50">Registered</p>
              <p className="font-inter text-sm text-white/90">
                {new Date(device.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {metadata && (
          <div className="mt-4 rounded-lg bg-black/20 p-4 border border-white/5">
            <p className="font-inter text-xs text-white/50 uppercase tracking-wider mb-3">
              Preview
            </p>
            <div className="space-y-2">
              {Object.entries(metadata).slice(0, 3).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <p className="font-inter text-xs text-white/50 min-w-[90px]">{key}:</p>
                  <p className="font-inter text-xs text-white/70 truncate">{value}</p>
                </div>
              ))}
              {Object.keys(metadata).length > 3 && (
                <p className="font-inter text-xs text-white/50 italic mt-2">
                  +{Object.keys(metadata).length - 3} more fields
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function MetadataItem({ 
  label, 
  value, 
  icon: Icon 
}: { 
  label: string
  value: string
  icon?: any 
}) {
  return (
    <div className="group rounded-lg border border-white/5 bg-white/5 p-5 transition-colors hover:bg-white/10">
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon className="size-5 text-white/50 group-hover:text-white/70" />}
        <p className="font-inter text-sm uppercase tracking-wider text-white/50 group-hover:text-white/70 font-medium">
          {label}
        </p>
      </div>
      <p className="font-inter text-base text-white/95 break-all leading-relaxed">{value}</p>
    </div>
  )
}

function DeviceModal({
  device,
  isOpen,
  onClose,
}: {
  device: Device | null
  isOpen: boolean
  onClose: () => void
}) {
  const metadata = device ? parseMetadata(device.metadata) : null

  if (!device) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[98vw] !w-[98vw] !sm:max-w-[98vw] overflow-hidden border-white/10 bg-[#0a0a0a] text-white p-0 sm:rounded-2xl gap-0 max-h-[95vh] [&>div]:overflow-hidden">
        <DialogHeader className="p-8 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
              <Cpu className="size-7" />
            </div>
            <div>
              <DialogTitle className="font-inter text-2xl font-light tracking-tight">
                Device #{device.id}
              </DialogTitle>
              <p className="font-inter text-sm text-white/50 mt-2">
                Registered {new Date(device.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-8 overflow-y-auto max-h-[calc(95vh-120px)] scrollbar-hide">
          {/* Basic Info */}
          <div className="space-y-4">
            <h4 className="font-inter text-base uppercase tracking-wider text-white/50 mb-4 flex items-center gap-2 font-medium">
              <Hash className="size-4" />
              Device Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <MetadataItem 
                label="Device ID" 
                value={`#${device.id}`}
                icon={Hash}
              />
              {device.wallet_address && (
                <MetadataItem 
                  label="Wallet Address" 
                  value={device.wallet_address}
                  icon={Wallet}
                />
              )}
              <MetadataItem 
                label="Registered" 
                value={new Date(device.created_at).toLocaleString()}
                icon={Calendar}
              />
            </div>
          </div>

          {/* Metadata */}
          {metadata && (
            <div className="space-y-4">
              <h4 className="font-inter text-base uppercase tracking-wider text-white/50 mb-4 flex items-center gap-2 font-medium">
                <Monitor className="size-4" />
                System Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {metadata.hostname && (
                  <MetadataItem 
                    label="Hostname" 
                    value={metadata.hostname}
                    icon={Monitor}
                  />
                )}
                {metadata.platform && (
                  <MetadataItem 
                    label="Platform" 
                    value={metadata.platform}
                    icon={HardDrive}
                  />
                )}
                {metadata.processor && (
                  <MetadataItem 
                    label="Processor" 
                    value={metadata.processor}
                    icon={Cpu}
                  />
                )}
                {metadata.machine && (
                  <MetadataItem 
                    label="Architecture" 
                    value={metadata.machine}
                    icon={HardDrive}
                  />
                )}
                {metadata.system && (
                  <MetadataItem 
                    label="System" 
                    value={metadata.system}
                    icon={Monitor}
                  />
                )}
                {metadata.release && (
                  <MetadataItem 
                    label="Release" 
                    value={metadata.release}
                    icon={Monitor}
                  />
                )}
                {metadata.cpu_model && metadata.cpu_model !== "Unknown" && (
                  <MetadataItem 
                    label="CPU Model" 
                    value={metadata.cpu_model}
                    icon={Cpu}
                  />
                )}
                {metadata.total_memory && metadata.total_memory !== "Unknown" && (
                  <MetadataItem 
                    label="Total Memory" 
                    value={metadata.total_memory}
                    icon={HardDrive}
                  />
                )}
                {metadata.serial && metadata.serial !== "Unknown" && (
                  <MetadataItem 
                    label="Serial Number" 
                    value={metadata.serial}
                    icon={Hash}
                  />
                )}
                {metadata.mac_address && metadata.mac_address !== "Unknown" && (
                  <MetadataItem 
                    label="MAC Address" 
                    value={metadata.mac_address}
                    icon={Network}
                  />
                )}
                {metadata.ip_address && (
                  <MetadataItem 
                    label="IP Address" 
                    value={metadata.ip_address}
                    icon={Globe}
                  />
                )}
              </div>
            </div>
          )}

          {!metadata && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-12 text-center">
              <p className="font-inter text-base text-white/50">No metadata available</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function MyDevices() {
  const { account } = useWallet()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Initialize device modal from URL params
  useEffect(() => {
    const deviceId = searchParams.get("device")
    if (deviceId && devices.length > 0) {
      const device = devices.find((d) => d.id.toString() === deviceId)
      if (device) {
        setSelectedDevice(device)
        setIsModalOpen(true)
      }
    }
  }, [searchParams, devices])

  useEffect(() => {
    if (!account) return

    const fetchDevices = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getUserDevices(account)
        setDevices(data)
      } catch (err: any) {
        setError(err.message || "Failed to load devices")
        console.error("Error fetching devices:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchDevices()
  }, [account])

  const handleDeviceClick = (device: Device) => {
    setSelectedDevice(device)
    setIsModalOpen(true)
    const params = new URLSearchParams(searchParams.toString())
    params.set("device", device.id.toString())
    router.push(`/dashboard?${params.toString()}`, { scroll: false })
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setTimeout(() => {
      setSelectedDevice(null)
      const params = new URLSearchParams(searchParams.toString())
      params.delete("device")
      router.push(`/dashboard?${params.toString()}`, { scroll: false })
    }, 300)
  }

  return (
    <>
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-inter text-3xl md:text-4xl font-light tracking-tight mb-2">
            My Devices
          </h2>
          <p className="text-muted-foreground font-inter font-light">
            Manage your registered data capture devices.
          </p>
        </motion.div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-blue-500 animate-spin" />
          </div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-lg border border-red-500/20 bg-red-500/10 p-4"
          >
            <p className="font-inter text-base text-red-400">{error}</p>
          </motion.div>
        )}

        {!loading && !error && devices.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 py-20 text-center"
          >
            <div className="mb-4 rounded-full bg-white/5 p-4">
              <Cpu className="size-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 font-inter font-medium text-white text-lg">No devices found</h3>
            <p className="font-inter text-base text-muted-foreground max-w-xs mx-auto">
              Connect a device to start capturing and monetizing your data.
            </p>
          </motion.div>
        )}

        {!loading && !error && devices.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {devices.map((device, index) => (
              <DeviceCard 
                key={device.id} 
                device={device} 
                index={index}
                onClick={() => handleDeviceClick(device)}
              />
            ))}
          </div>
        )}
      </div>

      <DeviceModal
        device={selectedDevice}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </>
  )
}
