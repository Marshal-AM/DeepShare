import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
// Use service_role key for server-side operations (bypasses RLS)
// Fall back to anon key if service_role is not set
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client
// If using service_role key, it bypasses RLS (secure for server-side)
// If using anon key, RLS policies must be properly configured
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { wallet_address, metadata } = body

    if (!wallet_address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    if (!metadata) {
      return NextResponse.json(
        { error: 'Metadata is required' },
        { status: 400 }
      )
    }

    // Check if device with this wallet address already exists
    const { data: existingDevice, error: checkError } = await supabase
      .from('Devices')
      .select('wallet_address')
      .eq('wallet_address', wallet_address)
      .limit(1)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is fine - means device doesn't exist
      console.error('Error checking existing device:', checkError)
      return NextResponse.json(
        { error: 'Failed to check device existence' },
        { status: 500 }
      )
    }

    if (existingDevice) {
      return NextResponse.json(
        { error: 'Device already exists', code: 'DEVICE_EXISTS' },
        { status: 409 } // 409 Conflict
      )
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from('Devices')
      .insert([
        {
          wallet_address: wallet_address,
          metadata: metadata,
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to insert device' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data,
    })
  } catch (error) {
    console.error('Error in submit-device API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

