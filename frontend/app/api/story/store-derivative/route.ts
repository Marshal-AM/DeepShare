import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      parentAssetId,
      derivativeIpId,
      txHash,
      userAddress,
      imageCid,
      metadataCid,
      ipMetadataCid,
      nftMetadataCid,
      licenseTermsId,
      parentIpId,
    } = body

    if (!derivativeIpId || !txHash || !userAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Store in derivatives table
    const { error } = await supabase.from('derivatives').insert({
      owner_address: userAddress.toLowerCase(),
      parent_asset_id: parentAssetId || null,
      parent_ip_id: parentIpId || null,
      derivative_ip_id: derivativeIpId,
      tx_hash: txHash,
      image_cid: imageCid || null,
      metadata_cid: metadataCid || null,
      ip_metadata_cid: ipMetadataCid || null,
      nft_metadata_cid: nftMetadataCid || null,
      license_terms_id: licenseTermsId || null,
    })

    if (error) {
      console.error('Error storing derivative:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to store derivative' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in store-derivative API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

