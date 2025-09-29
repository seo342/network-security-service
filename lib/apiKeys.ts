"use server"

import { supabase } from "@/lib/supabaseClient"
import { randomBytes } from "crypto"

export async function createApiKey(userId: string, name: string) {
  const apiKey = `sk_${randomBytes(32).toString("hex")}`

  const { error } = await supabase.from("api_keys").insert([
    {
      user_id: userId,
      name,
      key: apiKey,
    },
  ])

  if (error) throw error
  return apiKey
}
