/**
 * Client-side IPFS upload utilities using Pinata
 */

export async function uploadJSONToIPFS(jsonMetadata: any): Promise<string> {
  const pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT
  
  if (!pinataJWT) {
    throw new Error('PINATA_JWT is not configured. Please set NEXT_PUBLIC_PINATA_JWT in your environment variables.')
  }

  const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS'
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pinataJWT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pinataOptions: { cidVersion: 0 },
        pinataMetadata: { name: 'ip-metadata.json' },
        pinataContent: jsonMetadata,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to upload to IPFS: ${error}`)
    }

    const data = await response.json()
    return data.IpfsHash
  } catch (error: any) {
    console.error('Error uploading JSON to IPFS:', error)
    throw error
  }
}

export function getIPFSUrl(cid: string): string {
  const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs/'
  return `${gateway}${cid}`
}

