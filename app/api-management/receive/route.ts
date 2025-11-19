import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseServiceClient"
import { sendImmediateAlertEmail } from "@/lib/email"

/**
 * ✅ 위협 탐지 결과 수신 API (타입 개선 완전판)
 * - data.json 그대로 수신 가능
 * - incidents 테이블에 key_features_evidence, all_probabilities 저장
 * - inactive API 키 차단
 * - 이메일 알림 유지
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
      category,
      timestamp,
      flow_info,
      country,
      top_candidates,
      key_features_evidence,
      all_probabilities,
    } = body

    if (!auth_key)
      return NextResponse.json({ error: "Missing auth_key" }, { status: 400 })

    // ------------------------------------------------------------
    // 2️⃣ API 키 검증
    // ------------------------------------------------------------
    const { data: apiKeyData, error: keyError } = await supabaseAdmin
      .from("api_keys")
      .select("id, user_id, status, profiles ( email )")
      .eq("auth_key", auth_key)
      .maybeSingle()

    if (keyError || !apiKeyData)
      return NextResponse.json({ error: "Invalid auth_key" }, { status: 401 })

    // ✅ 타입 문제 해결: profiles를 any로 캐스팅
    const profileField = (apiKeyData as any).profiles
    const userEmail = Array.isArray(profileField)
      ? profileField[0]?.email
      : profileField?.email

    // ------------------------------------------------------------
    // 3️⃣ API 키 상태 확인
    // ------------------------------------------------------------
    if (apiKeyData.status !== "active") {
      console.warn(`🚫 비활성화된 API 키 접근 시도: ${auth_key}`)
      return NextResponse.json(
        { error: "API key is inactive. Access denied." },
        { status: 403 }
      )
    }

    // ------------------------------------------------------------
    // 4️⃣ 마지막 사용 시간 갱신
    // ------------------------------------------------------------
    await supabaseAdmin
      .from("api_keys")
      .update({ last_used: new Date().toISOString() })
      .eq("id", apiKeyData.id)

    // ------------------------------------------------------------
    // 5️⃣ 알림 설정 조회
    // ------------------------------------------------------------
    const { data: notifySetting } = await supabaseAdmin
      .from("notification_settings")
      .select("email_alert")
      .eq("user_id", apiKeyData.user_id)
      .maybeSingle()

    const emailAlertEnabled = notifySetting?.email_alert ?? true

    // ------------------------------------------------------------
    // 6️⃣ confidence 문자열 → 숫자 변환
    // ------------------------------------------------------------
    const parsedConfidence =
      typeof confidence === "string"
        ? parseFloat(confidence.replace("%", "")) / 100
        : confidence ?? 0

    // ------------------------------------------------------------
    // 7️⃣ 심각도 및 상태 계산
    // ------------------------------------------------------------
    const severity =
      detection_result?.toUpperCase() === "BENIGN"
        ? "low"
        : parsedConfidence >= 0.8
        ? "high"
        : parsedConfidence >= 0.5
        ? "medium"
        : "low"

    const status =
      detection_result?.toUpperCase() === "BENIGN" ? "resolved" : "active"

    // ------------------------------------------------------------
    // 8️⃣ incidents 테이블 삽입
    // ------------------------------------------------------------
    const { error: insertError } = await supabaseAdmin.from("incidents").insert([
      {
        time: timestamp || new Date().toISOString(),
        detection_result,
        confidence: parsedConfidence,
        category,
        severity,
        status,
        source_ip: flow_info?.src_ip ?? null,
        destination_ip: flow_info?.dst_ip ?? null,
        destination_port: flow_info?.dst_port ?? null,
        protocol: flow_info?.proto ?? null,
        country: country ?? null,
        flow_duration: flow_info?.flow_duration ?? null,
        packet_count: flow_info?.packet_count ?? null,
        byte_count: flow_info?.byte_count ?? null,
        flow_info: flow_info ?? null,
        top_candidates: top_candidates ?? null,
        key_features_evidence: key_features_evidence ?? null, // ✅ JSON 그대로 저장
        all_probabilities: all_probabilities ?? null, // ✅ JSON 그대로 저장
        auth_key,
        api_key_id: apiKeyData.id,
        user_id: apiKeyData.user_id,
      },
    ])

    if (insertError) {
      console.error("❌ [DB insert error]:", insertError.message)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // ------------------------------------------------------------
    // 9️⃣ 이메일 발송 (고위험만)
    // ------------------------------------------------------------
    const isHighThreat =
      detection_result &&
      detection_result.toUpperCase() !== "BENIGN" &&
      (severity === "high" ||
        parsedConfidence >= 0.9 ||
        /(ICMP_FLOOD|OTHER_TCP_FLOOD|Port_Scan|SYN_FLOOD|Slowloris_Attack|UDP_AMPLIFY|UDP_FLOOD|attack)/i.test(
          detection_result
        ))

    if (emailAlertEnabled && isHighThreat) {
      try {
        await sendImmediateAlertEmail(body, userEmail)
        console.log(`📨 이메일 발송 완료 (${userEmail})`)
      } catch (mailErr: any) {
        console.error("❌ [Email send failed]:", mailErr.message)
        throw mailErr
      }
    }

    // ------------------------------------------------------------
    // ✅ 최종 응답
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