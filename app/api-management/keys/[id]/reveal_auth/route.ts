import { NextResponse } from "next/server"
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

    // 🔹 api_keys 조회 (auth_key 포함)
    const { data: record, error } = await supabaseAdmin
      .from("api_keys")
      .select("user_id, auth_key, status")
      .eq("id", keyId)
      .single()

    if (error || !record)
      return NextResponse.json({ error: "API key not found" }, { status: 404 })

    // 사용자 인증
    if (record.user_id !== user.id)
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    if (record.status !== "active")
      return NextResponse.json({ error: "Key inactive" }, { status: 403 })

    // Auth Key 반환
    return NextResponse.json({
      message: "Auth key successfully retrieved",
      authKey: record.auth_key,
    })
  } catch (err: any) {
    console.error("❌ Auth Key Reveal Error:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
