import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseServiceClient"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // 구조 분해
    const {
      detection_result,
      confidence,
      category,
      Destination_Port,
      flow_info,
      flow_duration,
      packet_count,
      byte_count,
      timestamp,
      top_candidates,
    } = body

    const src_ip = flow_info?.src_ip || null
    const dst_ip = flow_info?.dst_ip || null
    const proto = flow_info?.proto || null

    // 🔹 심각도(severity) 자동 판별
    const severity =
      detection_result === "BENIGN"
        ? "Low"
        : confidence >= 0.8
        ? "High"
        : "Medium"

    // 🔹 상태(status)
    const status = "Detected"

    // 🔹 type은 category 그대로 사용
    const type = category || "Unknown"

    // 🔹 details 필드에 JSON 전체를 문자열로 저장
    const details = JSON.stringify({
      detection_result,
      confidence,
      Destination_Port,
      flow_info,
      flow_duration,
      packet_count,
      byte_count,
      top_candidates,
    })

    // ✅ Supabase에 저장 (incidents 테이블)
    const { error } = await supabaseAdmin.from("incidents").insert([
      {
        time: timestamp,
        type,
        source_ip: src_ip,
        severity,
        status,
        details,
      },
    ])

    if (error) {
      console.error("❌ DB 저장 실패:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`✅ [INCIDENT SAVED] ${type} | ${src_ip} → ${dst_ip}`)
    return NextResponse.json({ success: true, message: "Incidents 테이블에 저장 완료" })
  } catch (err: any) {
    console.error("❌ JSON 파싱 에러:", err.message)
    return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 })
  }
}

// 선택적: 최근 10개 incidents 조회
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("incidents")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
