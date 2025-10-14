import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseServiceClient"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // 1️⃣ 기본 필드 추출
    const {
      auth_key,
      detection_result,
      confidence,
      Destination_Port,
      category,
      flow_info,
      flow_duration,
      packet_count,
      byte_count,
      timestamp,
      top_candidates,
    } = body

    // 2️⃣ time, type, status 등 기본값 지정
    const now = new Date().toISOString()

    // 3️⃣ incidents insert
    const { error } = await supabaseAdmin.from("incidents").insert({
      time: timestamp ?? now,       // ✅ 반드시 time 채워주기
      type: "정상",                 // 기본값 (AI 탐지결과 기반으로 조정 가능)
      source_ip: flow_info?.src_ip ?? null,
      country: null,
      severity: "낮음",             // 기본값
      status: "진행중",             // 기본값
      details: body,                // ✅ 전체 JSON을 details 컬럼에 저장
      created_at: now,
    })

    if (error) {
      console.error("❌ incidents insert error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // auth_key를 api_key_id로 변환해서 insert
const { data: apiKeyRow, error: keyError } = await supabaseAdmin
  .from("api_keys")
  .select("id")
  .eq("api_key", auth_key)
  .single()

if (keyError || !apiKeyRow) {
  console.warn("⚠️ api_key not found for provided auth_key:", auth_key)
} else {
  const { error: usageError } = await supabaseAdmin.from("api_usage").insert({
    api_key_id: apiKeyRow.id,   // ✅ DB 실제 컬럼명
    endpoint: "/api-management/receive",
    requests: 1,
    threats: 0,
    created_at: new Date().toISOString(),
  })

  if (usageError) {
    console.warn("⚠️ api_usage insert warning:", usageError.message)
  }
}

    return NextResponse.json({ success: true, message: "Incident logged successfully" })
  } catch (err: any) {
    console.error("❌ Server error:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
