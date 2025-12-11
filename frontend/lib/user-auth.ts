import { supabase } from "./supabase"

export interface User {
  id: number
  created_at: string
  wallet_address: string | null
}

/**
 * Checks if a user exists with the given wallet address
 * If not, creates a new user record
 * Returns the user object
 */
export async function ensureUser(walletAddress: string): Promise<User> {
  try {
    // Normalize wallet address to lowercase for consistency
    const normalizedAddress = walletAddress.toLowerCase()

    // First, check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", normalizedAddress)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 is "not found" error, which is expected if user doesn't exist
      // Any other error should be thrown
      throw new Error(`Failed to check user existence: ${fetchError.message}`)
    }

    // If user exists, return it
    if (existingUser) {
      return existingUser as User
    }

    // User doesn't exist, create new user
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        wallet_address: normalizedAddress,
      })
      .select()
      .single()

    if (insertError) {
      // Handle unique constraint violation (race condition)
      if (insertError.code === "23505") {
        // User was created by another request, fetch it
        const { data: fetchedUser, error: refetchError } = await supabase
          .from("users")
          .select("*")
          .eq("wallet_address", normalizedAddress)
          .single()

        if (refetchError || !fetchedUser) {
          throw new Error(`Failed to fetch user after race condition: ${refetchError?.message}`)
        }

        return fetchedUser as User
      }

      throw new Error(`Failed to create user: ${insertError.message}`)
    }

    if (!newUser) {
      throw new Error("User creation returned no data")
    }

    return newUser as User
  } catch (error) {
    console.error("Error in ensureUser:", error)
    throw error
  }
}

