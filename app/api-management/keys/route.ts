import { NextResponse } from "next/server"
import crypto from "crypto"
import { supabaseAdmin } from "@/lib/supabaseServiceClient"

/**
 * ✅ GET: 로그인한 사용자의 API 키 목록 조회
 */
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const token = authHeader.split(" ")[1]
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !user)
      return NextResponse.json({ error: "Invalid user" }, { status: 401 })

    // ✅ 유저의 API 키 목록 조회
    const { data, error } = await supabaseAdmin
      .from("api_keys")
      .select("id, name, status, created_at, last_used, description, site_url")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) throw new Error(error.message)

    return NextResponse.json(data)
  } catch (err: any) {
    console.error("❌ GET /api-management/keys Error:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * ✅ POST: 새로운 API 키 생성
 * - DB에는 random_value, auth_key만 저장
 * - 사용자에게 apiKey(복원 가능한 해시) + authKey 반환
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const token = authHeader.split(" ")[1]
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !user)
      return NextResponse.json({ error: "Invalid user" }, { status: 401 })

    const { name, description } = await req.json()
    const secret = process.env.MASTER_SECRET_KEY || "default_secret"

    // 1️⃣ 랜덤값 + 인증키 생성
    const random_value = crypto.randomBytes(32).toString("hex")
    const auth_key = crypto.randomBytes(24).toString("hex")

    // 2️⃣ api_key 계산 (DB에는 저장 안 함)
    const api_key = crypto.createHash("sha256").update(random_value + secret).digest("hex")

    // 3️⃣ DB에 삽입
    const { error } = await supabaseAdmin.from("api_keys").insert([
      {
        user_id: user.id,
        name,
        description,
        random_value,
        auth_key,
        status: "active",
      },
    ])
    if (error) throw new Error(error.message)

    // 4️⃣ 사용자에게 키 반환
    return NextResponse.json({
      message: "API key created successfully",
      apiKey: api_key,
      authKey: auth_key,
    })
  } catch (err: any) {
    console.error("❌ POST /api-management/keys Error:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
