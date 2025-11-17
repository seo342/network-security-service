import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseServiceClient"

/**
 * ✅ Threat IP Report 수신 API (집계형 JSON 지원)
 * - data.json의 threat_ip_list를 반복 삽입
 * - source_ip → ip_address 매핑
 * - 중복 시 upsert
 */
export async function POST(req: Request) {
  try {
    // ------------------------------------------------------------
    // 1️⃣ 헤더 인증 확인
    // ------------------------------------------------------------
    const auth_key = req.headers.get("auth-key")
    if (!auth_key)
      return NextResponse.json({ error: "Missing auth-key header" }, { status: 400 })

    // ------------------------------------------------------------
    // 2️⃣ API 키 검증
    // ------------------------------------------------------------
    const { data: apiKey, error: keyError } = await supabaseAdmin
      .from("api_keys")
      .select("id, status")
      .eq("auth_key", auth_key)
      .maybeSingle()

    if (keyError || !apiKey)
      return NextResponse.json({ error: "Invalid auth_key" }, { status: 401 })

    if (apiKey.status !== "active")
      return NextResponse.json({ error: "Inactive API key" }, { status: 403 })

    // ------------------------------------------------------------
    // 3️⃣ 요청 본문 파싱
    // ------------------------------------------------------------
    const body = await req.json()
    const { total_unique_threat_ips, threat_ip_list } = body

    if (!Array.isArray(threat_ip_list) || threat_ip_list.length === 0) {
      return NextResponse.json({ error: "Invalid or empty threat_ip_list" }, { status: 400 })
    }

    console.log("📥 [Threat Report 수신 시작]")
    console.log(`⚠️ 총 위협 IP 수: ${total_unique_threat_ips ?? threat_ip_list.length}`)
    console.log(`📡 삽입 대상: ${threat_ip_list.length}건`)

    // ------------------------------------------------------------
    // 4️⃣ 데이터 변환 → threat_ips 테이블 구조로 매핑
    // ------------------------------------------------------------
    const threatRows = threat_ip_list.map((item: any) => ({
      api_key_id: apiKey.id,
      ip_address: item.source_ip,
      threat_level:
        item.total_hits > 10000
          ? "high"
          : item.total_hits > 2000
          ? "medium"
          : "low",
      ai_features: {
        total_hits: item.total_hits,
        last_seen: item.last_seen,
        events: item.events,
      },
      is_blocked: false,
    }))

    // ------------------------------------------------------------
    // 5️⃣ Supabase Upsert (중복 시 덮어쓰기)
    // ------------------------------------------------------------
    const { error: upsertError } = await supabaseAdmin
      .from("threat_ips")
      .upsert(threatRows, { onConflict: "api_key_id,ip_address" })

    if (upsertError) {
      console.error("❌ [DB upsert error]:", upsertError.message)
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    // ------------------------------------------------------------
    // ✅ 로그 출력
    // ------------------------------------------------------------
    console.log("✅ [DB 저장 완료]")
    threatRows.forEach((r, i) =>
      console.log(`#${i + 1} | ${r.ip_address} | ${r.threat_level} (${r.ai_features.total_hits} hits)`)
    )
    console.log("----------------------------------------------------")
    console.log(`총 ${threatRows.length}건 저장 완료 (api_key_id=${apiKey.id})`)
    console.log("====================================================")

    // ------------------------------------------------------------
    // ✅ 응답 반환
    // ------------------------------------------------------------
    return NextResponse.json({
      message: "✅ Threat IP report processed successfully",
      inserted_count: threatRows.length,
    })
  } catch (err: any) {
    console.error("❌ [Unexpected error]:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}