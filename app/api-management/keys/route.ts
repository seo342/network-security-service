import { NextResponse } from "next/server"
import crypto from "crypto"
import { supabaseAdmin } from "@/lib/supabaseServiceClient"

// ✅ API 키 목록 조회 (api_key, auth_key 모두 표시)
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

    // ✅ 유저의 API 키 + 인증키(auth_key) 모두 조회
    const { data, error } = await supabaseAdmin
      .from("api_keys")
      .select("id, name, status, created_at, last_used, api_key, auth_key, description, site_url")
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

// ✅ API 키 + 인증키 생성
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

    // ✅ API 키 및 인증키 생성
    const rawApiKey = crypto.randomBytes(32).toString("hex")
    const rawAuthKey = crypto.randomBytes(24).toString("hex") // 인증키는 24바이트 정도로 짧게

    const secretSalt = process.env.API_KEY_SALT || "default_salt"

    const key_hash = crypto.createHash("sha256").update(rawApiKey + secretSalt).digest("hex")
    const auth_hash = crypto.createHash("sha256").update(rawAuthKey + secretSalt).digest("hex")

    // ✅ Supabase에 저장 (api_key, auth_key 모두 저장)
    const { error: insertError } = await supabaseAdmin
      .from("api_keys")
      .insert([
        {
          user_id: user.id,
          name,
          description,
          status: "active",
          api_key: rawApiKey,
          auth_key: rawAuthKey,
          key_hash,
        },
      ])

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // ✅ 생성된 API Key와 인증키 함께 반환
    return NextResponse.json({
      message: "API Key and Auth Key generated successfully",
      apiKey: rawApiKey,
      authKey: rawAuthKey,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
