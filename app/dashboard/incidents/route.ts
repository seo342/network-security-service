// /app/api/dashboard/incidents/route.ts
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseServiceClient"

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

    // ✅ 해당 유저의 API 키 목록 조회
    const { data: apiKeys, error: keyError } = await supabaseAdmin
      .from("api_keys")
      .select("id")
      .eq("user_id", user.id)

    if (keyError) throw keyError
    if (!apiKeys || apiKeys.length === 0)
      return NextResponse.json({ incidents: [] })

    const keyIds = apiKeys.map((k) => k.id)

    // ✅ incidents 테이블에서 해당 api_key_id만 조회
    const { data: incidents, error: incidentError } = await supabaseAdmin
      .from("incidents")
      .select("*")
      .in("api_key_id", keyIds)
      .order("time", { ascending: false })
      .limit(100)

    if (incidentError) throw incidentError

    return NextResponse.json({ incidents })
  } catch (err: any) {
    console.error("🚨 incidents fetch 실패:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
