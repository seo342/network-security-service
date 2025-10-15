import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseServiceClient"

export async function POST(req: Request) {
  try {
    const body = await req.json()
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
      country,
    } = body

    // ✅ 1. auth_key 검증
    if (!auth_key) {
      return NextResponse.json({ error: "Missing auth_key" }, { status: 400 })
    }

    const { data: apiKeyData, error: keyError } = await supabaseAdmin
      .from("api_keys")
      .select("id, user_id, status")
      .eq("auth_key", auth_key)
      .single()

    if (keyError || !apiKeyData) {
      return NextResponse.json({ error: "Invalid auth_key" }, { status: 401 })
    }

    if (apiKeyData.status !== "active") {
      return NextResponse.json({ error: "API key inactive" }, { status: 403 })
    }

    // ✅ 2. 심각도 자동 분류
    const severity =
      detection_result === "BENIGN"
        ? "low"
        : confidence >= 0.8
        ? "high"
        : confidence >= 0.5
        ? "medium"
        : "low"

    const status = detection_result === "BENIGN" ? "resolved" : "active"

    // ✅ 3. incidents 삽입
    const { error: insertError } = await supabaseAdmin.from("incidents").insert([
      {
        time: timestamp || new Date().toISOString(),
        detection_result,
        confidence,
        category,
        severity,
        status,
        source_ip: flow_info?.src_ip,
        destination_ip: flow_info?.dst_ip,
        destination_port: Destination_Port,
        protocol: flow_info?.proto,
        country: country || null,
        flow_duration,
        packet_count,
        byte_count,
        flow_info,
        top_candidates,
        auth_key, // ✅ 트리거가 이걸로 API key를 찾음
      },
    ])

    if (insertError) {
      console.error("❌ [incidents insert error]:", insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // ✅ 성공 응답
    return NextResponse.json({
      message: "✅ Incident logged successfully — triggers updated all related tables.",
      api_key_id: apiKeyData.id,
      severity,
      status,
      category,
      timestamp: timestamp || new Date().toISOString(),
    })
  } catch (err: any) {
    console.error("❌ [Unexpected error]:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
