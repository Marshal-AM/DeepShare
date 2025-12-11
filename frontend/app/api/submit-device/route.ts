import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { wallet_address, metadata, owner_address } = body

    if (!wallet_address) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    if (!metadata) {
      return NextResponse.json({ error: "Metadata is required" }, { status: 400 })
    }

    if (!owner_address) {
      return NextResponse.json({ error: "Owner address is required" }, { status: 400 })
    }

    const normalizedWalletAddress = wallet_address.toLowerCase()
    const normalizedOwnerAddress = owner_address.toLowerCase()

    const { data: existingDevice, error: checkError } = await supabase
      .from("Devices")
      .select("wallet_address")
      .eq("wallet_address", normalizedWalletAddress)
      .limit(1)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking existing device:", checkError)
      return NextResponse.json(
        { error: "Failed to check device existence" },
        { status: 500 }
      )
    }

    if (existingDevice) {
      return NextResponse.json(
        { error: "Device already exists", code: "DEVICE_EXISTS" },
        { status: 409 }
      )
    }

    const { data, error } = await supabase
      .from("Devices")
      .insert([
        {
          wallet_address: normalizedWalletAddress,
          metadata: metadata,
          owner_address: normalizedOwnerAddress,
        },
      ])
      .select()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { error: error.message || "Failed to insert device" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data,
    })
  } catch (error) {
    console.error("Error in submit-device API:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

