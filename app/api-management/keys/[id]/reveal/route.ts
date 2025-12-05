import { NextResponse } from "next/server"
import crypto from "crypto"
import { supabaseAdmin } from "@/lib/supabaseServiceClient"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const token = authHeader.split(" ")[1]
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !user)
      return NextResponse.json({ error: "Invalid user" }, { status: 401 })

    const keyId = parseInt(params.id, 10)
    const secret = process.env.API_KEY_SALT
    if (!secret)
      return NextResponse.json({ error: "Server misconfigured: missing MASTER_SECRET_KEY" }, { status: 500 })

    //  랜덤값 조회
    const { data: record, error } = await supabaseAdmin
      .from("api_keys")
      .select("user_id, random_value, status")
      .eq("id", keyId)
      .single()

    if (error || !record)
      return NextResponse.json({ error: "API key not found" }, { status: 404 })
    if (record.user_id !== user.id)
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    if (record.status !== "active")
      return NextResponse.json({ error: "Key inactive" }, { status: 403 })

    //  복원
    const api_key = crypto.createHash("sha256").update(record.random_value + secret).digest("hex")

    //  응답
    return NextResponse.json({
      message: "API key successfully restored",
      apiKey: api_key,
    })
  } catch (err: any) {
    console.error("❌ Key Reveal Error:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
