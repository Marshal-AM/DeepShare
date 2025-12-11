"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useWallet } from "@/contexts/wallet-context"
import { getUserDerivatives, type Derivative } from "@/lib/dashboard-api"
import { getPinataImageUrl, fetchFromPinata } from "@/lib/pinata"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Image as ImageIcon, Loader2, ExternalLink, Calendar, Database, FileJson, Hash, Box, Layers } from "lucide-react"

function DerivativeCard({ derivative, onClick, index }: { derivative: Derivative; onClick: () => void; index: number }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (derivative.image_cid) {
      const url = getPinataImageUrl(derivative.image_cid)
      setImageUrl(url)
      setLoading(false)
    } else {
      setLoading(false)
    }
  }, [derivative.image_cid])

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
            alt={`Derivative ${derivative.id}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageUrl(null)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <p className="font-inter text-sm font-medium text-white">Derivative #{derivative.id}</p>
            <p className="font-inter text-xs text-white/70 truncate mt-1">
              {new Date(derivative.created_at).toLocaleDateString()}
            </p>
          </div>
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
          <Layers className="size-12 opacity-20" />
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

function DerivativeModal({
  derivative,
  isOpen,
  onClose,
}: {
  derivative: Derivative | null
  isOpen: boolean
  onClose: () => void
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [metadataLoading, setMetadataLoading] = useState(false)

  useEffect(() => {
    if (!derivative || !isOpen) return

    const loadData = async () => {
      setLoading(true)
      setMetadataLoading(false)
      setMetadata(null)

      // Load image
      if (derivative.image_cid) {
        const url = getPinataImageUrl(derivative.image_cid)
        setImageUrl(url)
      }
      setLoading(false)

      // Load metadata - try ip_metadata_cid first, then nft_metadata_cid, then metadata_cid
      const metadataCid = derivative.ip_metadata_cid || derivative.nft_metadata_cid || derivative.metadata_cid
      if (metadataCid) {
        setMetadataLoading(true)
        try {
          const data = await fetchFromPinata(metadataCid)
          setMetadata(data)
        } catch (error) {
          console.error("Error loading metadata:", error)
        } finally {
          setMetadataLoading(false)
        }
      }
    }

    loadData()
  }, [derivative, isOpen])

  if (!derivative) return null

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
              alt={`Derivative ${derivative.id}`}
              className="max-h-full max-w-full object-contain drop-shadow-2xl rounded-lg"
              onError={() => setImageUrl(null)}
            />
          ) : (
            <div className="flex flex-col items-center gap-4 text-white/20">
              <Layers className="size-16" />
              <p className="font-inter text-lg">Image unavailable</p>
            </div>
          )}
        </div>

        {/* Details Section - Right/Bottom */}
        <div className="w-full md:w-[500px] flex flex-col bg-[#0a0a0a]">
          <DialogHeader className="p-8 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                <Layers className="size-7" />
              </div>
              <div>
                <DialogTitle className="font-inter text-2xl font-light tracking-tight">
                  Derivative #{derivative.id}
                </DialogTitle>
                <p className="font-inter text-sm text-white/50 mt-2">
                  Created {new Date(derivative.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="font-inter text-base uppercase tracking-wider text-white/50 mb-4 flex items-center gap-2 font-medium">
                <Database className="size-4" />
                Derivative Information
              </h4>
              <div className="space-y-4">
                <MetadataItem 
                  label="Created At" 
                  value={new Date(derivative.created_at).toLocaleString()} 
                  icon={Calendar}
                />
                {derivative.derivative_ip_id && (
                  <div className="group rounded-lg border border-white/5 bg-white/5 p-5 transition-colors hover:bg-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <Hash className="size-5 text-white/50 group-hover:text-white/70" />
                      <p className="font-inter text-sm uppercase tracking-wider text-white/50 group-hover:text-white/70 font-medium">
                        Derivative IP ID
                      </p>
                    </div>
                    <a 
                      href={`https://aeneid.explorer.story.foundation/ipa/${derivative.derivative_ip_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-inter text-base text-blue-400 hover:text-blue-300 break-all leading-relaxed flex items-center gap-2"
                    >
                      Open in Aeneid Explorer
                      <ExternalLink className="size-4 shrink-0" />
                    </a>
                  </div>
                )}
                {derivative.parent_ip_id && (
                  <div className="group rounded-lg border border-white/5 bg-white/5 p-5 transition-colors hover:bg-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <Layers className="size-5 text-white/50 group-hover:text-white/70" />
                      <p className="font-inter text-sm uppercase tracking-wider text-white/50 group-hover:text-white/70 font-medium">
                        Parent IP ID
                      </p>
                    </div>
                    <a 
                      href={`${derivative.parent_ip_id}`}
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
                {derivative.image_cid && (
                  <MetadataItem 
                    label="Image CID" 
                    value={derivative.image_cid}
                    icon={Hash}
                  />
                )}
                {derivative.ip_metadata_cid && (
                  <MetadataItem 
                    label="IP Metadata CID" 
                    value={derivative.ip_metadata_cid}
                    icon={FileJson}
                  />
                )}
                {derivative.nft_metadata_cid && (
                  <MetadataItem 
                    label="NFT Metadata CID" 
                    value={derivative.nft_metadata_cid}
                    icon={FileJson}
                  />
                )}
                {derivative.metadata_cid && (
                  <MetadataItem 
                    label="Metadata CID" 
                    value={derivative.metadata_cid}
                    icon={FileJson}
                  />
                )}
                {derivative.tx_hash && (
                  <div className="group rounded-lg border border-white/5 bg-white/5 p-5 transition-colors hover:bg-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <Hash className="size-5 text-white/50 group-hover:text-white/70" />
                      <p className="font-inter text-sm uppercase tracking-wider text-white/50 group-hover:text-white/70 font-medium">
                        Transaction Hash
                      </p>
                    </div>
                    <a 
                      href={`https://aeneid.storyscan.io/tx/${derivative.tx_hash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-inter text-base text-blue-400 hover:text-blue-300 break-all leading-relaxed flex items-center gap-2"
                    >
                      {derivative.tx_hash}
                      <ExternalLink className="size-4 shrink-0" />
                    </a>
                  </div>
                )}
              </div>
            </div>

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

export function MyDerivatives() {
  const { account } = useWallet()
  const [derivatives, setDerivatives] = useState<Derivative[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDerivative, setSelectedDerivative] = useState<Derivative | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (!account) return

    const fetchDerivatives = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getUserDerivatives(account)
        setDerivatives(data)
      } catch (err: any) {
        setError(err.message || "Failed to load derivatives")
        console.error("Error fetching derivatives:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchDerivatives()
  }, [account])

  return (
    <div className="space-y-8 h-full flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="font-inter text-3xl md:text-4xl font-light tracking-tight mb-2">
          My Derivatives
        </h2>
        <p className="text-muted-foreground font-inter font-light">
          View and manage your derivative IP assets created from marketplace assets.
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

      {!loading && !error && derivatives.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 py-20 text-center min-h-[300px]"
        >
          <div className="mb-4 rounded-full bg-white/5 p-4">
            <Layers className="size-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 font-medium text-white">No derivatives found</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Derivatives you create from marketplace assets will appear here.
          </p>
        </motion.div>
      )}

      {!loading && !error && derivatives.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        >
          <AnimatePresence>
            {derivatives.map((derivative, index) => (
              <DerivativeCard
                key={derivative.id}
                derivative={derivative}
                index={index}
                onClick={() => {
                  setSelectedDerivative(derivative)
                  setIsModalOpen(true)
                }}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <DerivativeModal
        derivative={selectedDerivative}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedDerivative(null)
        }}
      />
    </div>
  )
}

