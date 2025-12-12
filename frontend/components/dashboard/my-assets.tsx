"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useWallet } from "@/contexts/wallet-context"
import { getUserImages, type Image } from "@/lib/dashboard-api"
import { getPinataImageUrl, fetchFromPinata } from "@/lib/pinata"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Image as ImageIcon, Loader2, ExternalLink, Calendar, Database, FileJson, Hash, Box, DollarSign, CheckCircle2, AlertCircle } from "lucide-react"
import { createStoryClientFromWallet } from "@/lib/story-client"
import { claimRevenueForIp } from "@/lib/royalty-utils"

function ImageCard({ image, onClick, index }: { image: Image; onClick: () => void; index: number }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (image.image_cid) {
      const url = getPinataImageUrl(image.image_cid)
      setImageUrl(url)
      setLoading(false)
    } else {
      setLoading(false)
    }
  }, [image.image_cid])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      onClick={onClick}
      className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-all duration-300 hover:border-white/30"
    >
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/5">
          <Loader2 className="size-8 animate-spin text-white/20" />
        </div>
      ) : imageUrl ? (
        <>
          <img
            src={imageUrl}
            alt={`Asset ${image.id}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageUrl(null)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <p className="font-inter text-sm font-medium text-white">ID: {image.id}</p>
            <p className="font-inter text-xs text-white/70 truncate mt-1">
              {new Date(image.created_at).toLocaleDateString()}
            </p>
          </div>
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
          <ImageIcon className="size-12 opacity-20" />
          <p className="font-inter text-sm">No Preview</p>
        </div>
      )}
    </motion.div>
  )
}

function MetadataItem({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) {
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

function ImageModal({
  image,
  isOpen,
  onClose,
}: {
  image: Image | null
  isOpen: boolean
  onClose: () => void
}) {
  const { account } = useWallet()
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [metadataLoading, setMetadataLoading] = useState(false)
  const [claimingRevenue, setClaimingRevenue] = useState(false)
  const [claimResult, setClaimResult] = useState<{ success: boolean; message: string; txHash?: string } | null>(null)

  useEffect(() => {
    if (!image || !isOpen) return

    const loadData = async () => {
      setLoading(true)
      setMetadataLoading(false)
      setMetadata(null)

      // Load image
      if (image.image_cid) {
        const url = getPinataImageUrl(image.image_cid)
        setImageUrl(url)
      }
      setLoading(false)

      // Load metadata
      if (image.metadata_cid) {
        setMetadataLoading(true)
        try {
          const data = await fetchFromPinata(image.metadata_cid)
          setMetadata(data)
        } catch (error) {
          console.error("Error loading metadata:", error)
        } finally {
          setMetadataLoading(false)
        }
      }
    }

    loadData()
  }, [image, isOpen])

  const handleClaimRevenue = async () => {
    if (!image?.ip || !account) return

    setClaimingRevenue(true)
    setClaimResult(null)

    try {
      const client = await createStoryClientFromWallet()
      const result = await claimRevenueForIp(client, image.ip)
      
      setClaimResult({
        success: true,
        message: `Successfully claimed revenue!`,
        txHash: result.txHash,
      })
    } catch (error: any) {
      setClaimResult({
        success: false,
        message: error.message || 'Failed to claim revenue',
      })
    } finally {
      setClaimingRevenue(false)
    }
  }

  if (!image) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[98vw] !w-[98vw] !sm:max-w-[98vw] overflow-hidden border-white/10 bg-[#0a0a0a] text-white p-0 sm:rounded-2xl gap-0 flex flex-col md:flex-row h-[90vh] md:h-[95vh]">
        {/* Image Section - Left/Top */}
        <div className="relative flex-1 bg-black/40 flex items-center justify-center p-8 border-b md:border-b-0 md:border-r border-white/10 min-h-[300px]">
          {loading ? (
            <Loader2 className="size-12 animate-spin text-white/20" />
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={`Asset ${image.id}`}
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

        {/* Details Section - Right/Bottom */}
        <div className="w-full md:w-[500px] flex flex-col bg-[#0a0a0a]">
          <DialogHeader className="p-8 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                <Box className="size-7" />
              </div>
              <div>
                <DialogTitle className="font-inter text-2xl font-light tracking-tight">
                  Asset #{image.id}
                </DialogTitle>
                <p className="font-inter text-sm text-white/50 mt-2">
                  Created {new Date(image.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="font-inter text-base uppercase tracking-wider text-white/50 mb-4 flex items-center gap-2 font-medium">
                <Database className="size-4" />
                Asset Information
              </h4>
              <div className="space-y-4">
                <MetadataItem 
                  label="Created At" 
                  value={new Date(image.created_at).toLocaleString()} 
                  icon={Calendar}
                />
                {image.ip && (
                  <div className="group rounded-lg border border-white/5 bg-white/5 p-5 transition-colors hover:bg-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <Hash className="size-5 text-white/50 group-hover:text-white/70" />
                      <p className="font-inter text-sm uppercase tracking-wider text-white/50 group-hover:text-white/70 font-medium">
                        Origin IP
                      </p>
                    </div>
                    <a 
                      href={`${image.ip}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-inter text-base text-blue-400 hover:text-blue-300 break-all leading-relaxed flex items-center gap-2"
                    >
                      Open in Aeneid Explorer
                      <ExternalLink className="size-4 shrink-0" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Identifiers */}
            <div className="space-y-4">
              <h4 className="font-inter text-base uppercase tracking-wider text-white/50 mb-4 flex items-center gap-2 font-medium">
                <Hash className="size-4" />
                Identifiers
              </h4>
              <div className="space-y-4">
                {image.image_cid && (
                  <MetadataItem 
                    label="Image CID" 
                    value={image.image_cid}
                    icon={Hash}
                  />
                )}
                {image.metadata_cid && (
                  <MetadataItem 
                    label="Metadata CID" 
                    value={image.metadata_cid}
                    icon={FileJson}
                  />
                )}
                {image.tx_hash && (
                  <div className="group rounded-lg border border-white/5 bg-white/5 p-5 transition-colors hover:bg-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <Hash className="size-5 text-white/50 group-hover:text-white/70" />
                      <p className="font-inter text-sm uppercase tracking-wider text-white/50 group-hover:text-white/70 font-medium">
                        Transaction Hash
                      </p>
                    </div>
                    <a 
                      href={`https://aeneid.storyscan.io/tx/${image.tx_hash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-inter text-base text-blue-400 hover:text-blue-300 break-all leading-relaxed flex items-center gap-2"
                    >
                      {image.tx_hash}
                      <ExternalLink className="size-4 shrink-0" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Claim Revenue Section */}
            {image.ip && account && (
              <div className="space-y-4">
                <h4 className="font-inter text-base uppercase tracking-wider text-white/50 mb-4 flex items-center gap-2 font-medium">
                  <DollarSign className="size-4" />
                  Revenue
                </h4>
                <div className="space-y-3">
                  <button
                    onClick={handleClaimRevenue}
                    disabled={claimingRevenue}
                    className="w-full px-4 py-3 rounded-lg font-inter text-sm font-medium text-white bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {claimingRevenue ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Claiming Revenue...</span>
                      </>
                    ) : (
                      <>
                        <DollarSign className="size-4" />
                        <span>Claim All Revenue</span>
                      </>
                    )}
                  </button>
                  
                  {claimResult && (
                    <div className={`rounded-lg border p-3 ${
                      claimResult.success 
                        ? 'border-green-500/30 bg-green-500/10' 
                        : 'border-red-500/30 bg-red-500/10'
                    }`}>
                      <div className="flex items-start gap-2">
                        {claimResult.success ? (
                          <CheckCircle2 className="size-4 text-green-400 mt-0.5 shrink-0" />
                        ) : (
                          <AlertCircle className="size-4 text-red-400 mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className={`font-inter text-sm ${
                            claimResult.success ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {claimResult.message}
                          </p>
                          {claimResult.txHash && (
                            <a
                              href={`https://aeneid.storyscan.io/tx/${claimResult.txHash}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-xs text-blue-400 hover:text-blue-300 mt-1 block"
                            >
                              View Transaction <ExternalLink className="size-3 inline ml-1" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Metadata JSON Accordion */}
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function MyAssets() {
  const { account } = useWallet()
  const [images, setImages] = useState<Image[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<Image | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (!account) return

    const fetchImages = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getUserImages(account)
        setImages(data)
      } catch (err: any) {
        setError(err.message || "Failed to load images")
        console.error("Error fetching images:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchImages()
  }, [account])

  return (
    <div className="space-y-8 h-full flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="font-inter text-3xl md:text-4xl font-light tracking-tight mb-2">
          Digital Assets
        </h2>
        <p className="text-muted-foreground font-inter font-light">
          View and manage your captured media assets.
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

      {!loading && !error && images.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 py-20 text-center min-h-[300px]"
        >
          <div className="mb-4 rounded-full bg-white/5 p-4">
            <ImageIcon className="size-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 font-medium text-white">No assets found</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Captured images from your devices will appear here automatically.
          </p>
        </motion.div>
      )}

        {!loading && !error && images.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image, index) => (
              <ImageCard
                key={image.id}
                image={image}
                index={index}
                onClick={() => {
                  setSelectedImage(image)
                  setIsModalOpen(true)
                }}
              />
            ))}
          </div>
        )}

      <ImageModal
        image={selectedImage}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setTimeout(() => setSelectedImage(null), 300)
        }}
      />
    </div>
  )
}
