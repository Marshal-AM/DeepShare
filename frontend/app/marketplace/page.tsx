"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { getAllMarketplaceAssets, type MarketplaceAsset } from "@/lib/dashboard-api"
import { getPinataImageUrl } from "@/lib/pinata"
import { MarketplaceModal } from "@/components/marketplace/marketplace-modal"
import { Loader2, Image as ImageIcon, Search } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { CustomCursor } from "@/components/custom-cursor"
import { SmoothScroll } from "@/components/smooth-scroll"

function MarketplaceCard({ 
  asset, 
  onClick, 
  index 
}: { 
  asset: MarketplaceAsset
  onClick: () => void
  index: number 
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (asset.image_cid) {
      const url = getPinataImageUrl(asset.image_cid)
      setImageUrl(url)
      setLoading(false)
    } else {
      setLoading(false)
    }
  }, [asset.image_cid])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      onClick={onClick}
      className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-all duration-300 hover:border-white/30 hover:scale-[1.02] hover:shadow-2xl"
    >
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/5">
          <Loader2 className="size-8 animate-spin text-white/20" />
        </div>
      ) : imageUrl ? (
        <>
          <img
            src={imageUrl}
            alt={`Asset ${asset.id}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageUrl(null)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <div className="flex items-center justify-between mb-1">
              <p className="font-inter text-sm font-medium text-white">Asset #{asset.id}</p>
              <span className="text-[10px] uppercase tracking-wider font-medium px-2 py-1 rounded bg-white/10 text-white/80">
                {asset.device ? "Verified" : "Unknown"}
              </span>
            </div>
            <p className="font-inter text-xs text-white/60 truncate">
              {new Date(asset.created_at).toLocaleDateString()}
            </p>
            {asset.device?.owner_address && (
              <p className="font-inter text-[10px] text-white/40 truncate mt-2 font-mono">
                Owner: {asset.device.owner_address.slice(0, 6)}...{asset.device.owner_address.slice(-4)}
              </p>
            )}
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

export default function MarketplacePage() {
  const [assets, setAssets] = useState<MarketplaceAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAsset, setSelectedAsset] = useState<MarketplaceAsset | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true)
        const data = await getAllMarketplaceAssets()
        setAssets(data)
      } catch (err: any) {
        setError(err.message || "Failed to load assets")
        console.error("Error fetching marketplace assets:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchAssets()
  }, [])

  const filteredAssets = assets.filter(asset => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      asset.id.toString().includes(query) ||
      asset.wallet_address?.toLowerCase().includes(query) ||
      asset.device?.owner_address?.toLowerCase().includes(query)
    )
  })

  return (
    <SmoothScroll>
      <CustomCursor />
      <Navbar />
      <main className="min-h-screen bg-[#050505] pt-32 pb-20">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="font-sans text-4xl md:text-5xl font-light tracking-tight text-white mb-4">
                The Asset Marketplace
              </h1>
              <p className="font-inter text-lg text-white/60 font-light max-w-xl">
                Discover and license authentic real-world data assets directly from their owners.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative w-full md:w-80"
            >
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="size-4 text-white/30" />
              </div>
              <input
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all"
              />
            </motion.div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-40">
              <div className="w-16 h-16 rounded-full border-2 border-white/10 border-t-white/50 animate-spin" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-8 text-center">
              <p className="text-red-400 font-inter">{error}</p>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-20 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <ImageIcon className="size-8 text-white/20" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">No assets found</h3>
              <p className="text-white/40">Try adjusting your search terms</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAssets.map((asset, index) => (
                <MarketplaceCard
                  key={asset.id}
                  asset={asset}
                  index={index}
                  onClick={() => {
                    setSelectedAsset(asset)
                    setIsModalOpen(true)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      <MarketplaceModal
        asset={selectedAsset}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </SmoothScroll>
  )
}

