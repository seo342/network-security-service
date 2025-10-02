// app/api-management/test-juice/route.ts
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseServiceClient"

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Missing API key" }, { status: 401 })
    }

    const apiKey = authHeader.replace("Bearer ", "")

    // DB에서 해당 api_key가 존재하는지 확인
    const { data, error } = await supabaseAdmin
      .from("api_keys")
      .select("id, name, status")
      .eq("api_key", apiKey)   // api_key 직접 매칭 (JWT 아님)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: "Invalid API Key" }, { status: 403 })
    }

    return NextResponse.json({
      message: `API Key '${data.name}' 인증 성공`,
      keyId: data.id,
      status: data.status,
    })
  } catch (err: any) {
    console.error("Test-Juice Route Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
