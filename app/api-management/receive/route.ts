import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseServiceClient"
import { sendImmediateAlertEmail } from "@/lib/email"

/**
 * ✅ 위협 탐지 결과 수신 API (개선 버전)
 * - incidents 테이블에 로그 저장
 * - 사용자의 알림 설정(notification_settings)에 따라 이메일 발송
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

    if (!auth_key) {
      return NextResponse.json({ error: "Missing auth_key" }, { status: 400 })
    }

    // ------------------------------------------------------------
    // 2️⃣ API 키 검증 및 사용자 정보 조회
    // ------------------------------------------------------------
    const { data: apiKeyData, error: keyError } = await supabaseAdmin
      .from("api_keys")
      .select("id, user_id, status, profiles ( email )")
      .eq("auth_key", auth_key)
      .maybeSingle()

    if (keyError || !apiKeyData) {
      return NextResponse.json({ error: "Invalid auth_key" }, { status: 401 })
    }

    if (apiKeyData.status !== "active") {
      return NextResponse.json({ error: "API key inactive" }, { status: 403 })
    }

    // ✅ 이메일 추출 (profiles 관계 필드 안전 처리)
    let userEmail: string | undefined
    const profileField = (apiKeyData as any).profiles
    if (Array.isArray(profileField)) {
      userEmail = profileField[0]?.email
    } else if (profileField && typeof profileField === "object") {
      userEmail = profileField.email
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found for this API key" },
        { status: 400 }
      )
    }

    // ------------------------------------------------------------
    // 3️⃣ 이메일 알림 설정(notification_settings) 조회
    // ------------------------------------------------------------
    const { data: notifySetting, error: notifyError } = await supabaseAdmin
      .from("notification_settings")
      .select("email_alert")
      .eq("user_id", apiKeyData.user_id)
      .maybeSingle()

    if (notifyError) {
      console.error("⚠️ [알림 설정 조회 오류]:", notifyError.message)
    }

    const emailAlertEnabled = notifySetting?.email_alert ?? true // 기본값 true

    // ------------------------------------------------------------
    // 4️⃣ 위협 심각도 자동 분류
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
    // 5️⃣ incidents 테이블에 삽입
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
      return NextResponse.json({ error: "Database insert failed" }, { status: 500 })
    }

    // ------------------------------------------------------------
    // 6️⃣ 이메일 발송 조건 검사
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
    } else if (!emailAlertEnabled) {
      console.log(`📪 이메일 알림 비활성화 → ${userEmail}`)
    }

    // ------------------------------------------------------------
    // 7️⃣ 응답 반환
    // ------------------------------------------------------------
    return NextResponse.json({
      message: "✅ Incident logged successfully.",
      api_key_id: apiKeyData.id,
      severity,
      status,
      category,
      emailAlertEnabled,
      timestamp: timestamp || new Date().toISOString(),
    })
  } catch (err: any) {
    console.error("❌ [Unexpected error]:", err.message)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
