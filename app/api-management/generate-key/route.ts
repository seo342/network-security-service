import { NextResponse } from "next/server"
import crypto from "crypto"
import { supabaseAdmin } from "@/lib/supabaseServiceClient"  // ✅ 서버 전용 클라이언트 (service_role 키)

export async function POST(req: Request) {
  try {
    // 1) 인증 헤더 확인
    const authHeader = req.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // JWT 토큰에서 유저 추출
    const token = authHeader.split(" ")[1]
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: "Invalid user" }, { status: 401 })
    }

    const {name,description}=await req.json()

    // 2) 원본 API 키 생성
    const rawApiKey = crypto.randomBytes(32).toString("hex")

    // 3) 해시 생성 (원본 + secretSalt)
    const secretSalt = process.env.API_KEY_SALT || "default_salt"
    const key_hash = crypto
      .createHash("sha256")
      .update(rawApiKey + secretSalt)   //env.local의 salt 추가
      .digest("hex")

    // 4) DB 저장
    const { error: insertError } = await supabaseAdmin
      .from("api_keys")
      .insert([
        {
          user_id: user.id,
          name,
          description,
          status: "active",
          api_key: rawApiKey,  // 원본 키 저장 (나중에 여기 지우고 해시만 남겨도 됨)
          key_hash: key_hash,  // 해시 저장
        },
      ])

    if (insertError) {
      console.error("Insert Error:", insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // 5) 발급 완료 (원본 키는 여기서 클라이언트로 반환 가능)
    return NextResponse.json({
      message: "API Key generated successfully",
      apiKey: rawApiKey, // 이건 발급 직후에만 반환 → DB에서는 복호화 불가
    })
  } catch (err: any) {
    console.error("Unexpected Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
