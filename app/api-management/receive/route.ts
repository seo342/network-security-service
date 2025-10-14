import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseServiceClient"

/**
 * 🔹 분석 서버 → 분석 결과 수신 엔드포인트
 * 요청 body 예시:
 * {
 *   "auth_key": "0be6da27bbfd332aa76763f1497d9e852fa41c452ea2e29c",
 *   "detection_result": "BENIGN",
 *   "confidence": 0.79,
 *   "Destination_Port": 443,
 *   "category": "Normal",
 *   "flow_info": { "src_ip": "...", "dst_ip": "...", "proto": 17 },
 *   "flow_duration": 15.5,
 *   "packet_count": 9,
 *   "byte_count": 2232,
 *   "timestamp": "2025-10-13T07:13:23.035865+00:00",
 *   "top_candidates": [ ... ]
 * }
 */
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

    // ✅ 2. 심각도(severity) 자동 분류
    const severity =
      detection_result === "BENIGN"
        ? "low"
        : confidence >= 0.8
        ? "high"
        : confidence >= 0.5
        ? "medium"
        : "low"

    const status = detection_result === "BENIGN" ? "resolved" : "active"

    // ✅ 3. incidents 테이블에 삽입 (트리거 자동 실행)
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
        flow_duration,
        packet_count,
        byte_count,
        flow_info,
        top_candidates,
        api_key_id: apiKeyData.id, // ✅ FK 매핑
      },
    ])

    if (insertError) {
      console.error("❌ incidents insert error:", insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // ⚡ 이제 트리거가 자동으로 아래 테이블을 갱신합니다:
    // traffic_logs, attack_types, hourly_patterns, country_threats, metrics_summary, api_usage

    return NextResponse.json({
      message: "✅ Incident successfully logged (trigger updated related tables)",
      api_key_id: apiKeyData.id,
      severity,
      status,
    })
  } catch (err: any) {
    console.error("❌ Unexpected error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
