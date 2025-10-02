import { NextResponse } from "next/server"
import crypto from "crypto"
import { supabaseAdmin } from "@/lib/supabaseServiceClient"

// 🔑 API 키 조회
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: "Invalid user" }, { status: 401 })
    }

    // 유저의 API 키만 조회
    const { data, error } = await supabaseAdmin
      .from("api_keys")
      .select("id, name, status, created_at, last_used, api_key, description, site_url")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// 🔑 API 키 생성
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: "Invalid user" }, { status: 401 })
    }

    const { name, description } = await req.json()

    const rawApiKey = crypto.randomBytes(32).toString("hex")
    const secretSalt = process.env.API_KEY_SALT || "default_salt"
    const key_hash = crypto.createHash("sha256").update(rawApiKey + secretSalt).digest("hex")

    const { error: insertError } = await supabaseAdmin
      .from("api_keys")
      .insert([
        {
          user_id: user.id,
          name,
          description,
          status: "active",
          api_key: rawApiKey,
          key_hash,
        },
      ])

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      message: "API Key generated successfully",
      apiKey: rawApiKey,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
