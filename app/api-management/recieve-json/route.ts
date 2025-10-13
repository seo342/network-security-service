import { NextResponse } from "next/server"
import crypto from "crypto"
import { supabaseAdmin } from "@/lib/supabaseServiceClient"

interface FlowInfo {
  src_ip?: string
  dst_ip?: string
  proto?: number
}
interface Candidate {
  label: string
  prob: number
}
interface DetectionData {
  detection_result: string
  confidence: number
  category: string
  Destination_Port: number
  flow_info: FlowInfo
  flow_duration: number
  packet_count: number
  byte_count: number
  timestamp: string
  top_candidates?: Candidate[]
}

export async function POST(req: Request) {
  try {
    const body: DetectionData = await req.json()

    // Authorization 헤더에서 복원된 api_key 추출
    const authHeader = req.headers.get("authorization")
    const apiKey = authHeader?.split(" ")[1] || null
    if (!apiKey)
      return NextResponse.json({ error: "Missing API key" }, { status: 401 })

    // ✅ 환경 변수에서 salt 가져오기 (MASTER_SECRET_KEY 대신)
    const secret = process.env.API_KEY_SALT
    if (!secret)
      return NextResponse.json({ error: "Server misconfigured: missing API_KEY_SALT" }, { status: 500 })

    // ✅ api_keys 테이블에서 모든 active 키 조회
    const { data: allKeys, error: keyError } = await supabaseAdmin
      .from("api_keys")
      .select("id, random_value, status")

    if (keyError) throw keyError
    if (!allKeys || allKeys.length === 0)
      throw new Error("No API keys found")

    // ✅ apiKey 해시 비교
    let apiKeyId: number | null = null
    for (const k of allKeys) {
      if (k.status !== "active") continue
      const hash = crypto
        .createHash("sha256")
        .update(k.random_value + secret)
        .digest("hex")

      if (hash === apiKey) {
        apiKeyId = k.id
        break
      }
    }

    if (!apiKeyId) {
      console.warn("⚠️ 유효하지 않은 API 키:", apiKey)
      return NextResponse.json({ error: "Invalid API key" }, { status: 403 })
    }

    // --- 데이터 구조 분해 ---
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
    } = body

    const src_ip = flow_info?.src_ip ?? null
    const dst_ip = flow_info?.dst_ip ?? null

    // --- 심각도(severity) ---
    const severity =
      detection_result === "BENIGN"
        ? "낮음"
        : confidence >= 0.8
        ? "높음"
        : "중간"

    // --- 상태, 유형 ---
    const status = "진행중"
    const type =
      category === "Normal" || category === "BENIGN"
        ? "정상"
        : category || "알 수 없음"

    // --- 상세(JSON) ---
    const details = JSON.stringify(body)

    // ✅ incidents 삽입
    const { error: incidentError } = await supabaseAdmin.from("incidents").insert([
      {
        time: timestamp,
        type,
        source_ip: src_ip,
        severity,
        status,
        details,
      },
    ])
    if (incidentError)
      throw new Error(`incidents insert: ${incidentError.message}`)

    // ✅ attack_types 업데이트
    if (type !== "정상") {
      const { data: existing } = await supabaseAdmin
        .from("attack_types")
        .select("id, count")
        .eq("type", type)
        .maybeSingle()

      if (existing) {
        await supabaseAdmin
          .from("attack_types")
          .update({ count: existing.count + 1 })
          .eq("id", existing.id)
      } else {
        await supabaseAdmin
          .from("attack_types")
          .insert([{ type, count: 1 }])
      }
    }

    // ✅ traffic_logs 업데이트
    const date = timestamp.split("T")[0]
    const { data: log } = await supabaseAdmin
      .from("traffic_logs")
      .select("id, requests, threats")
      .eq("time", date)
      .maybeSingle()

    if (log) {
      await supabaseAdmin
        .from("traffic_logs")
        .update({
          requests: log.requests + 1,
          threats: detection_result === "BENIGN" ? log.threats : log.threats + 1,
        })
        .eq("id", log.id)
    } else {
      await supabaseAdmin
        .from("traffic_logs")
        .insert([
          {
            time: date,
            requests: 1,
            threats: detection_result === "BENIGN" ? 0 : 1,
          },
        ])
    }

    // ✅ api_usage 기록
    console.log("✅ api_usage logging 시작:", apiKeyId)

    const { data: usageData, error: usageError } = await supabaseAdmin
      .from("api_usage")
      .upsert(
        {
          api_key_id: apiKeyId,
          endpoint: "analyze",
          requests: 1,
          threats: detection_result === "BENIGN" ? 0 : 1,
        },
        { onConflict: "api_key_id,endpoint" }
      )
      .select()

    if (usageError)
      console.error("⚠️ api_usage upsert 실패:", usageError.message)
    else console.log("✅ api_usage 결과:", usageData)

    console.log(`✅ [INCIDENT SAVED] ${type} | ${src_ip} → ${dst_ip}`)
    return NextResponse.json({
      success: true,
      message: "Incidents + 통계 + 사용 로그 저장 완료",
    })
  } catch (err: any) {
    console.error("❌ recieve-json 에러:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
