import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseServiceClient"

/**
 * ✅ 이메일 알림 설정 API
 * - 사용자별 notification_settings 테이블 관리
 * - GET: 설정 조회
 * - POST: 설정 변경
 */

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const user_id = url.searchParams.get("user_id")

    if (!user_id) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("notification_settings")
      .select("*")
      .eq("user_id", user_id)
      .maybeSingle()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error("❌ [GET /dashboard/setting/notification] Error:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { user_id, email_alert } = await req.json()

    if (!user_id) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("notification_settings")
      .upsert(
        {
          user_id,
          email_alert,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error("❌ [POST /dashboard/setting/notification] Error:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
