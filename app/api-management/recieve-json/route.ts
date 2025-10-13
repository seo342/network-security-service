import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseServiceClient"

// TypeScript 인터페이스
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

    // Authorization 헤더에서 인증키 추출
    const authHeader = req.headers.get("authorization")
    const authKey = authHeader?.split(" ")[1] || null

    // 1️⃣ auth_key 검증 및 api_keys.id 조회
    let apiKeyId: number | null = null
    if (authKey) {
      const { data: keyData, error: keyError } = await supabaseAdmin
        .from("api_keys")
        .select("id")
        .eq("auth_key", authKey)
        .single()

      if (keyError) {
        console.warn("⚠️ 인증키 조회 실패:", keyError.message)
      } else {
        apiKeyId = keyData?.id ?? null
      }
    }

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

    const src_ip = flow_info?.src_ip ?? null
    const dst_ip = flow_info?.dst_ip ?? null
    const proto = flow_info?.proto ?? null

    // 2️⃣ 심각도(severity) 판별
    const severity =
      detection_result === "BENIGN"
        ? "Low"
        : confidence >= 0.8
        ? "High"
        : "Medium"

    // 3️⃣ 상태(status)
    const status = "Detected"

    // 4️⃣ type = category
    const type = category || "Unknown"

    // 5️⃣ details (JSON 문자열화)
    const details = JSON.stringify(body)

    // ✅ incidents 테이블 삽입
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
    if (incidentError) throw new Error(`incidents insert: ${incidentError.message}`)

    // ✅ attack_types 업데이트 (해당 공격 유형 count +1)
    if (type !== "Normal" && type !== "BENIGN") {
      // 이미 존재하면 count +1, 없으면 새로 생성
      const { data: existing } = await supabaseAdmin
        .from("attack_types")
        .select("id, count")
        .eq("type", type)
        .single()

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

    // ✅ traffic_logs 업데이트 (일자별 요청/위협 카운트)
    const date = timestamp.split("T")[0]
    const { data: log } = await supabaseAdmin
      .from("traffic_logs")
      .select("id, requests, threats")
      .eq("time", date)
      .single()

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

    // ✅ api_usage 로그 기록 (해당 키로 요청한 경우)
    if (apiKeyId) {
      const { data: usage } = await supabaseAdmin
        .from("api_usage")
        .select("id, requests, threats")
        .eq("api_key_id", apiKeyId)
        .eq("endpoint", "analyze")
        .single()

      if (usage) {
        await supabaseAdmin
          .from("api_usage")
          .update({
            requests: usage.requests + 1,
            threats: detection_result === "BENIGN" ? usage.threats : usage.threats + 1,
          })
          .eq("id", usage.id)
      } else {
        await supabaseAdmin
          .from("api_usage")
          .insert([
            {
              api_key_id: apiKeyId,
              endpoint: "analyze",
              requests: 1,
              threats: detection_result === "BENIGN" ? 0 : 1,
            },
          ])
      }
    }

    console.log(`✅ [INCIDENT SAVED] ${type} | ${src_ip} → ${dst_ip}`)
    return NextResponse.json({
      success: true,
      message: "Incidents + 통계 + 사용 로그 저장 완료",
    })
  } catch (err: any) {
    console.error("❌ 에러 발생:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// 최근 10개 incidents 조회용 (GET)
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
