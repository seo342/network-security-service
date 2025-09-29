import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import bcrypt from "bcryptjs"
import crypto from "crypto"

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "")

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: () => "",
        set: () => {},
        remove: () => {},
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const key = `sk_${crypto.randomUUID()}`
  const keyHash = await bcrypt.hash(key, 10)

  const { error } = await supabase.from("api_keys").insert({
    user_id: user.id,
    name: "새 API 키",
    key_hash: keyHash,
    status: "active",
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ apiKey: key })
}
