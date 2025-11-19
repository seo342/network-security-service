// /app/api/dashboard/traffic/route.ts
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseServiceClient"

export async function GET(req: Request) {
  try {
    // ✅ 사용자 토큰 인증
    const authHeader = req.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: "Invalid user" }, { status: 401 })
    }

    // ✅ 해당 유저의 API 키 ID 조회
    const { data: apiKeys, error: keyError } = await supabaseAdmin
      .from("api_keys")
      .select("id")
      .eq("user_id", user.id)

    if (keyError) throw keyError
    if (!apiKeys || apiKeys.length === 0) {
      return NextResponse.json({ logs: [] })
    }

    const keyIds = apiKeys.map((k) => k.id)

    // ✅ traffic_logs 테이블에서 해당 api_key_id만 조회
    const { data: logs, error: logError } = await supabaseAdmin
      .from("traffic_logs")
      .select("*")
      .in("api_key_id", keyIds)
      .order("time", { ascending: false })
      .limit(100)

    if (logError) throw logError

    return NextResponse.json({ logs })
  } catch (err: any) {
    console.error("🚨 traffic_logs fetch 실패:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
