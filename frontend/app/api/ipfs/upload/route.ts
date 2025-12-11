import { NextRequest, NextResponse } from 'next/server'

/**
 * Server-side IPFS upload route
 * Uses Pinata JWT from environment variables
 */
export async function POST(request: NextRequest) {
  try {
    const pinataJWT = process.env.PINATA_JWT
    
    if (!pinataJWT) {
      return NextResponse.json(
        { error: 'PINATA_JWT is not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { metadata, type = 'json' } = body

    if (!metadata) {
      return NextResponse.json(
        { error: 'Metadata is required' },
        { status: 400 }
      )
    }

    if (type === 'json') {
      const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS'
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${pinataJWT}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pinataOptions: { cidVersion: 0 },
          pinataMetadata: { name: 'metadata.json' },
          pinataContent: metadata,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to upload to IPFS: ${error}`)
      }

      const data = await response.json()
      return NextResponse.json({ 
        success: true,
        cid: data.IpfsHash 
      })
    }

    return NextResponse.json(
      { error: 'Unsupported upload type' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error uploading to IPFS:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload to IPFS' },
      { status: 500 }
    )
  }
}

