"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { type MarketplaceAsset } from "@/lib/dashboard-api"
import { getPinataImageUrl, fetchFromPinata } from "@/lib/pinata"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Box, 
  Database, 
  Calendar, 
  Hash, 
  FileJson, 
  ExternalLink, 
  Image as ImageIcon, 
  Loader2, 
  Cpu, 
  Wallet, 
  Monitor, 
  HardDrive, 
  Network, 
  Globe,
  User
} from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { UseAssetModal } from "./use-asset-modal"

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
    <div className="group rounded-lg border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10">
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className="size-4 text-white/50 group-hover:text-white/70" />}
        <p className="font-inter text-xs uppercase tracking-wider text-white/50 group-hover:text-white/70 font-medium">
          {label}
        </p>
      </div>
      <p className="font-inter text-sm text-white/95 break-all leading-relaxed">{value}</p>
    </div>
  )
}

function parseMetadata(metadata: string | null): Record<string, string> | null {
  if (!metadata) return null
  try {
    return JSON.parse(metadata)
  } catch {
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

interface MarketplaceModalProps {
  asset: MarketplaceAsset | null
  isOpen: boolean
  onClose: () => void
}

export function MarketplaceModal({ asset, isOpen, onClose }: MarketplaceModalProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [metadataLoading, setMetadataLoading] = useState(false)
  const [isUseAssetModalOpen, setIsUseAssetModalOpen] = useState(false)

  // Prevent body scroll and disable Lenis when modal is open
  useEffect(() => {
    if (isOpen) {
      // Store original overflow value
      const originalOverflow = document.body.style.overflow
      const originalPaddingRight = document.body.style.paddingRight
      
      // Calculate scrollbar width to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      
      // Lock body scroll
      document.body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }

      // Disable Lenis smooth scroll - try multiple methods
      const lenisInstance = (window as any).lenis
      if (lenisInstance) {
        lenisInstance.stop()
      }

      // Also try to find Lenis via data attribute
      const lenisElement = document.querySelector('[data-lenis-root]')
      if (lenisElement) {
        const lenis = (lenisElement as any).__lenis
        if (lenis) {
          lenis.stop()
        }
      }

      // Find all elements with lenis and stop them
      const allLenisElements = document.querySelectorAll('[data-lenis-root], [data-lenis-prevent]')
      allLenisElements.forEach((el) => {
        const lenis = (el as any).__lenis
        if (lenis) {
          lenis.stop()
        }
      })
      
      return () => {
        // Restore original styles
        document.body.style.overflow = originalOverflow
        document.body.style.paddingRight = originalPaddingRight

        // Re-enable Lenis
        if (lenisInstance) {
          lenisInstance.start()
        }
        if (lenisElement) {
          const lenis = (lenisElement as any).__lenis
          if (lenis) {
            lenis.start()
          }
        }
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (!asset || !isOpen) return

    const loadData = async () => {
      setLoading(true)
      setMetadataLoading(false)
      setMetadata(null)

      if (asset.image_cid) {
        const url = getPinataImageUrl(asset.image_cid)
        setImageUrl(url)
      }
      setLoading(false)

      if (asset.metadata_cid) {
        setMetadataLoading(true)
        try {
          const data = await fetchFromPinata(asset.metadata_cid)
          setMetadata(data)
        } catch (error) {
          console.error("Error loading metadata:", error)
        } finally {
          setMetadataLoading(false)
        }
      }
    }

    loadData()
  }, [asset, isOpen])

  if (!asset) return null

  const deviceMetadata = asset.device ? parseMetadata(asset.device.metadata) : null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="!max-w-[95vw] !w-[95vw] sm:!max-w-5xl border-white/10 bg-[#0a0a0a] text-white p-0 sm:rounded-2xl gap-0 flex flex-col md:flex-row h-[90vh] md:h-[85vh] max-h-[90vh] md:max-h-[85vh] overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        data-lenis-prevent
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {/* Left Side - Image Preview */}
        <div className="relative w-full md:w-[45%] bg-black/40 flex items-center justify-center p-8 border-b md:border-b-0 md:border-r border-white/10 min-h-[300px] shrink-0 overflow-hidden">
          {loading ? (
            <Loader2 className="size-12 animate-spin text-white/20" />
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={`Asset ${asset.id}`}
              className="max-h-full max-w-full object-contain drop-shadow-2xl rounded-lg"
              onError={() => setImageUrl(null)}
            />
          ) : (
            <div className="flex flex-col items-center gap-4 text-white/20">
              <ImageIcon className="size-16" />
              <p className="font-inter text-lg">Image unavailable</p>
            </div>
          )}
        </div>

        {/* Right Side - Details & Tabs */}
        <div className="flex-1 flex flex-col bg-[#0a0a0a] min-w-0 overflow-hidden relative">
          <DialogHeader className="p-6 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <Box className="size-6" />
              </div>
              <div>
                <DialogTitle className="font-inter text-xl font-light tracking-tight">
                  Asset #{asset.id}
                </DialogTitle>
                <p className="font-inter text-sm text-white/50 mt-1">
                  Minted {new Date(asset.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="asset" className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="px-6 pt-4 shrink-0">
              <TabsList className="w-full bg-white/5 border border-white/10 p-1">
                <TabsTrigger value="asset" className="flex-1 font-inter">Asset Details</TabsTrigger>
                <TabsTrigger value="owner" className="flex-1 font-inter">Owner Details</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden relative">
              <TabsContent 
                value="asset" 
                className="absolute inset-0 overflow-y-auto p-6 pb-24 space-y-6 scrollbar-hide m-0 data-[state=active]:block"
                data-lenis-prevent
                onWheel={(e) => {
                  e.stopPropagation()
                  const target = e.currentTarget
                  const { scrollTop, scrollHeight, clientHeight } = target
                  const isAtTop = scrollTop === 0
                  const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1
                  
                  if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
                    e.preventDefault()
                  }
                }}
                onTouchMove={(e) => e.stopPropagation()}
              >
              <div className="space-y-4">
                <h4 className="font-inter text-sm uppercase tracking-wider text-white/50 flex items-center gap-2 font-medium">
                  <Database className="size-4" />
                  Technical Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <MetadataItem 
                    label="Created At" 
                    value={new Date(asset.created_at).toLocaleString()} 
                    icon={Calendar}
                  />
                  {asset.ip && (
                    <div className="group rounded-lg border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="size-4 text-white/50 group-hover:text-white/70" />
                        <p className="font-inter text-xs uppercase tracking-wider text-white/50 group-hover:text-white/70 font-medium">
                          Origin IP
                        </p>
                      </div>
                      <a 
                        href={`${asset.ip}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-inter text-sm text-blue-400 hover:text-blue-300 break-all flex items-center gap-2"
                      >
                        Open in Aeneid Explorer
                        <ExternalLink className="size-3 shrink-0" />
                      </a>
                    </div>
                  )}
                  {asset.image_cid && (
                    <MetadataItem 
                      label="Image CID" 
                      value={asset.image_cid} 
                      icon={Hash}
                    />
                  )}
                  {asset.metadata_cid && (
                    <MetadataItem 
                      label="Metadata CID" 
                      value={asset.metadata_cid} 
                      icon={FileJson}
                    />
                  )}
                </div>
                {asset.tx_hash && (
                  <div className="group rounded-lg border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Hash className="size-4 text-white/50 group-hover:text-white/70" />
                      <p className="font-inter text-xs uppercase tracking-wider text-white/50 group-hover:text-white/70 font-medium">
                        Transaction Hash
                      </p>
                    </div>
                    <a 
                      href={`https://aeneid.storyscan.io/tx/${asset.tx_hash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-inter text-sm text-blue-400 hover:text-blue-300 break-all flex items-center gap-2"
                    >
                      {asset.tx_hash}
                      <ExternalLink className="size-3 shrink-0" />
                    </a>
                  </div>
                )}
              </div>

              {(metadata || metadataLoading) && (
                <div className="space-y-2">
                  <Accordion type="single" collapsible className="w-full border border-white/10 rounded-lg bg-white/5">
                    <AccordionItem value="metadata" className="border-none">
                      <AccordionTrigger className="px-5 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <FileJson className="size-5 text-white/50" />
                          <span className="font-inter text-base text-white/90">Metadata Object</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-5 pb-5">
                        <div className="rounded-lg border border-white/10 bg-black/40 p-4">
                          {metadataLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="size-6 animate-spin text-white/20" />
                            </div>
                          ) : (
                            <pre className="font-mono text-xs text-white/70 overflow-x-auto scrollbar-hide leading-relaxed">
                              {JSON.stringify(metadata, null, 2)}
                            </pre>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              )}
            </TabsContent>

              <TabsContent 
                value="owner" 
                className="absolute inset-0 overflow-y-auto p-6 pb-24 space-y-6 scrollbar-hide m-0 data-[state=active]:block"
                data-lenis-prevent
                onWheel={(e) => {
                  e.stopPropagation()
                  const target = e.currentTarget
                  const { scrollTop, scrollHeight, clientHeight } = target
                  const isAtTop = scrollTop === 0
                  const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1
                  
                  if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
                    e.preventDefault()
                  }
                }}
                onTouchMove={(e) => e.stopPropagation()}
              >
              {asset.device ? (
                <>
                  <div className="space-y-4">
                    <h4 className="font-inter text-sm uppercase tracking-wider text-white/50 flex items-center gap-2 font-medium">
                      <User className="size-4" />
                      Owner & Device
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      <MetadataItem 
                        label="Owner Address" 
                        value={asset.device.owner_address || "Unknown"} 
                        icon={Wallet}
                      />
                      <MetadataItem 
                        label="Device Wallet" 
                        value={asset.device.wallet_address || "Unknown"} 
                        icon={Cpu}
                      />
                      <MetadataItem 
                        label="Device ID" 
                        value={`#${asset.device.id}`} 
                        icon={Hash}
                      />
                    </div>
                  </div>

                  {deviceMetadata && (
                    <div className="space-y-4">
                      <h4 className="font-inter text-sm uppercase tracking-wider text-white/50 flex items-center gap-2 font-medium">
                        <Monitor className="size-4" />
                        Device Specs
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {deviceMetadata.hostname && (
                          <MetadataItem label="Hostname" value={deviceMetadata.hostname} icon={Monitor} />
                        )}
                        {deviceMetadata.platform && (
                          <MetadataItem label="Platform" value={deviceMetadata.platform} icon={HardDrive} />
                        )}
                        {deviceMetadata.processor && (
                          <MetadataItem label="Processor" value={deviceMetadata.processor} icon={Cpu} />
                        )}
                        {deviceMetadata.system && (
                          <MetadataItem label="System" value={deviceMetadata.system} icon={Monitor} />
                        )}
                        {deviceMetadata.cpu_model && deviceMetadata.cpu_model !== "Unknown" && (
                          <MetadataItem label="CPU" value={deviceMetadata.cpu_model} icon={Cpu} />
                        )}
                        {deviceMetadata.total_memory && deviceMetadata.total_memory !== "Unknown" && (
                          <MetadataItem label="Memory" value={deviceMetadata.total_memory} icon={HardDrive} />
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center space-y-3">
                  <div className="p-3 rounded-full bg-white/5">
                    <User className="size-6 text-white/20" />
                  </div>
                  <p className="text-white/40 font-inter text-sm">Owner information not available</p>
                </div>
              )}
              </TabsContent>
            </div>
          </Tabs>

          {/* Fixed Footer with Use Asset Button */}
          {asset.ip && (
            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/10 bg-[#0a0a0a] z-10 shrink-0">
              <button
                onClick={() => setIsUseAssetModalOpen(true)}
                className="w-full px-4 py-3 rounded-lg font-inter text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors"
              >
                Use This Asset
              </button>
            </div>
          )}
        </div>
      </DialogContent>

      <UseAssetModal
        asset={asset}
        isOpen={isUseAssetModalOpen}
        onClose={() => setIsUseAssetModalOpen(false)}
        onSuccess={(derivativeIpId, txHash) => {
          // Don't close the modal here - let the user see the success state and close manually
          // The modal will stay open until the user clicks the close button
        }}
      />
    </Dialog>
  )
}

