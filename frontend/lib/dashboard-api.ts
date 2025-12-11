import { supabase } from "./supabase"

export interface Device {
  id: number
  created_at: string
  wallet_address: string | null
  metadata: string | null
  owner_address: string | null
}

export interface Image {
  id: number
  created_at: string
  wallet_address: string | null
  image_cid: string | null
  metadata_cid: string | null
  ip: string | null
  tx_hash: string | null
}

export interface MarketplaceAsset extends Image {
  device: Device | null
}

export interface Derivative {
  id: number
  created_at: string
  owner_address: string | null
  parent_asset_id: number | null
  parent_ip_id: string | null
  derivative_ip_id: string | null
  tx_hash: string | null
  image_cid: string | null
  metadata_cid: string | null
  ip_metadata_cid: string | null
  nft_metadata_cid: string | null
  license_terms_id: number | null
}

export async function getUserDevices(walletAddress: string): Promise<Device[]> {
  try {
    const normalizedAddress = walletAddress.toLowerCase()

    const { data: allDevices, error } = await supabase
      .from("Devices")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch devices: ${error.message}`)
    }

    const userDevices = (allDevices || []).filter(
      (device) => device.owner_address?.toLowerCase() === normalizedAddress
    )

    return userDevices as Device[]
  } catch (error) {
    console.error("Error fetching devices:", error)
    throw error
  }
}

export async function getUserImages(walletAddress: string): Promise<Image[]> {
  try {
    const normalizedAddress = walletAddress.toLowerCase()

    const { data: devices, error: devicesError } = await supabase
      .from("Devices")
      .select("wallet_address, owner_address")

    if (devicesError) {
      throw new Error(`Failed to fetch devices: ${devicesError.message}`)
    }

    const userDevices = devices?.filter(
      (d) => d.owner_address?.toLowerCase() === normalizedAddress
    ) || []

    const deviceWalletAddresses = userDevices
      .map((d) => d.wallet_address)
      .filter((addr): addr is string => addr !== null)
      .map((addr) => addr.toLowerCase())

    const { data: allImages, error: imagesError } = await supabase
      .from("images")
      .select("*")
      .order("created_at", { ascending: false })

    if (imagesError) {
      throw new Error(`Failed to fetch images: ${imagesError.message}`)
    }

    const allAddressesToMatch = deviceWalletAddresses.length > 0
      ? [...deviceWalletAddresses, normalizedAddress]
      : [normalizedAddress]

    const filteredImages = (allImages || []).filter((image) => {
      if (!image.wallet_address) return false
      return allAddressesToMatch.includes(image.wallet_address.toLowerCase())
    })

    return filteredImages as Image[]
  } catch (error) {
    console.error("Error fetching images:", error)
    throw error
  }
}

export async function getAllMarketplaceAssets(): Promise<MarketplaceAsset[]> {
  try {
    // Fetch all images
    const { data: images, error: imagesError } = await supabase
      .from("images")
      .select("*")
      .order("created_at", { ascending: false })

    if (imagesError) {
      throw new Error(`Failed to fetch marketplace images: ${imagesError.message}`)
    }

    // Fetch all devices to map owners
    const { data: devices, error: devicesError } = await supabase
      .from("Devices")
      .select("*")

    if (devicesError) {
      throw new Error(`Failed to fetch devices: ${devicesError.message}`)
    }

    // Create a map of wallet_address (lowercase) to Device
    const deviceMap = new Map<string, Device>()
    devices?.forEach((device) => {
      if (device.wallet_address) {
        deviceMap.set(device.wallet_address.toLowerCase(), device)
      }
    })

    // Combine images with device info
    const marketplaceAssets = (images || []).map((image) => {
      const imageWalletAddress = image.wallet_address?.toLowerCase()
      const device = imageWalletAddress ? deviceMap.get(imageWalletAddress) : null
      
      return {
        ...image,
        device: device || null
      }
    })

    return marketplaceAssets as MarketplaceAsset[]
  } catch (error) {
    console.error("Error fetching marketplace assets:", error)
    throw error
  }
}

export async function getUserDerivatives(walletAddress: string): Promise<Derivative[]> {
  try {
    const normalizedAddress = walletAddress.toLowerCase()

    // Fetch all derivatives and filter in JavaScript for case-insensitive comparison
    const { data: allDerivatives, error } = await supabase
      .from("derivatives")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch derivatives: ${error.message}`)
    }

    // Filter derivatives by owner_address (case-insensitive)
    const userDerivatives = (allDerivatives || []).filter(
      (derivative) => derivative.owner_address?.toLowerCase() === normalizedAddress
    )

    return userDerivatives as Derivative[]
  } catch (error) {
    console.error("Error fetching derivatives:", error)
    throw error
  }
}
