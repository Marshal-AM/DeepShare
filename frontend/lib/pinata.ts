/**
 * Fetch data from Pinata IPFS gateway
 */
export async function fetchFromPinata(cid: string): Promise<any> {
  try {
    // Pinata public gateway
    const pinataGateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs/"
    const url = `${pinataGateway}${cid}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch from Pinata: ${response.statusText}`)
    }

    // Check if it's an image or JSON
    const contentType = response.headers.get("content-type")
    if (contentType?.includes("image")) {
      // Return the image URL
      return url
    }

    // Otherwise, parse as JSON
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching from Pinata:", error)
    throw error
  }
}

/**
 * Get image URL from Pinata CID
 */
export function getPinataImageUrl(cid: string | null): string | null {
  if (!cid) return null
  const pinataGateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs/"
  return `${pinataGateway}${cid}`
}

