import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseServiceClient"
import { sendImmediateAlertEmail } from "@/lib/email"

/**
 * ✅ 위협 탐지 결과 수신 API (최신 통합 버전)
 * - incidents 테이블에 로그 저장
 * - threat_ips 테이블에 IP별 위협 정보 저장 (api_key_id 기준)
 * - inactive API 키 차단
 * - 이메일 알림 설정(notification_settings)에 따라 발송
 */
export async function POST(req: Request) {
  try {
    // ------------------------------------------------------------
    // 1️⃣ 요청 Body 파싱
    // ------------------------------------------------------------
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

    if (!auth_key)
      return NextResponse.json({ error: "Missing auth_key" }, { status: 400 })

    // ------------------------------------------------------------
    // 2️⃣ API 키 검증 및 사용자 정보 조회
    // ------------------------------------------------------------
    const { data: apiKeyData, error: keyError } = await supabaseAdmin
      .from("api_keys")
      .select("id, user_id, status, profiles ( email )")
      .eq("auth_key", auth_key)
      .maybeSingle()

    if (keyError || !apiKeyData)
      return NextResponse.json({ error: "Invalid auth_key" }, { status: 401 })

    if (apiKeyData.status !== "active") {
      console.warn(`🚫 비활성화된 API 키 접근 시도: ${auth_key}`)
      return NextResponse.json(
        { error: "API key is inactive. Access denied." },
        { status: 403 }
      )
    }

    // ------------------------------------------------------------
    // 3️⃣ API 사용 기록 업데이트
    // ------------------------------------------------------------
    await supabaseAdmin
      .from("api_keys")
      .update({ last_used: new Date().toISOString() })
      .eq("id", apiKeyData.id)

    // ✅ 이메일 추출 (profiles 관계 필드 안전 처리)
    const profileField = (apiKeyData as any).profiles
    const userEmail = Array.isArray(profileField)
      ? profileField[0]?.email
      : profileField?.email

    // ------------------------------------------------------------
    // 4️⃣ 알림 설정(notification_settings)
    // ------------------------------------------------------------
    const { data: notifySetting } = await supabaseAdmin
      .from("notification_settings")
      .select("email_alert")
      .eq("user_id", apiKeyData.user_id)
      .maybeSingle()

    const emailAlertEnabled = notifySetting?.email_alert ?? true

    // ------------------------------------------------------------
    // 5️⃣ 위협 심각도 자동 분류
    // ------------------------------------------------------------
    const severity =
      detection_result === "BENIGN"
        ? "low"
        : confidence >= 0.8
        ? "high"
        : confidence >= 0.5
        ? "medium"
        : "low"

    const status = detection_result === "BENIGN" ? "resolved" : "active"

    // ------------------------------------------------------------
    // 6️⃣ incidents 테이블에 삽입
    // ------------------------------------------------------------
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("incidents")
      .insert([
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
          auth_key,
          api_key_id: apiKeyData.id,
        },
      ])
      .select()
      .single()

    if (insertError) {
      console.error("❌ [DB insert error]:", insertError.message)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // ------------------------------------------------------------
    // 7️⃣ threat_ips 테이블 upsert
    // ------------------------------------------------------------
    if (flow_info?.src_ip) {
      const ipData = {
        api_key_id: apiKeyData.id,
        ip_address: flow_info.src_ip,
        country: country || null,
        threat_level: severity,
        detected_at: new Date().toISOString(),
      }

      const { data: ipInsert, error: ipError } = await supabaseAdmin
        .from("threat_ips")
        .upsert(ipData, { onConflict: "api_key_id,ip_address" })
        .select()

      console.log("✅ threat_ips upsert 결과:", ipInsert)
      if (ipError) {
        console.error("❌ [threat_ips upsert error]:", ipError.message)
        return NextResponse.json(
          { error: "threat_ips upsert failed", details: ipError.message },
          { status: 500 }
        )
      }
    } else {
      console.warn("⚠️ flow_info.src_ip가 없음, threat_ips insert 건너뜀")
    }

    // ------------------------------------------------------------
    // 8️⃣ 이메일 발송 조건 검사
    // ------------------------------------------------------------
    const isHighThreat =
      detection_result !== "BENIGN" &&
      (
        severity === "high" ||
        (confidence && confidence >= 0.9) ||
        /(dos|ddos|malware|ransom|trojan|exploit|brute|attack)/i.test(
          detection_result
        )
      )

    if (emailAlertEnabled && isHighThreat) {
      try {
        await sendImmediateAlertEmail(inserted, userEmail)
        console.log(`📨 이메일 발송 완료 (${userEmail})`)
      } catch (mailErr: any) {
        console.error("❌ [Email send failed]:", mailErr.message)
      }
    }

    // ------------------------------------------------------------
    // 9️⃣ 최종 응답
    // ------------------------------------------------------------
    return NextResponse.json({
      message: "✅ Incident logged successfully.",
      severity,
      status,
      emailAlertEnabled,
    })
  } catch (err: any) {
    console.error("❌ [Unexpected error]:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
