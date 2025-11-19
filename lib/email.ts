import nodemailer from "nodemailer"
import { format } from "date-fns"

// ======================================================
// ✅ SMTP 기반 즉시 위협 알림 메일 (수정 버전)
// ======================================================
export async function sendImmediateAlertEmail(incident: any, userEmail: string) {
  try {
    if (!userEmail || !userEmail.trim()) {
      throw new Error("User email is required for alert email")
    }

    // ✅ SMTP 트랜스포터 설정
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465, // 포트 465면 SSL 사용
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    // ✅ 연결 검증
    await transporter.verify()
    console.log("✅ [SMTP] Transporter verified successfully")

    // ------------------------------------------------------
    // 📩 이메일 내용 구성
    // ------------------------------------------------------
    const to = [userEmail]
    const category =
      incident.category || "미분류"
    const subject = `[⚠️ 보안 경고] ${category} 관련 이벤트 감지됨`

    // ✅ core_metrics 표시용
    const metrics = incident?.key_features_evidence?.core_metrics || {}
    const metricHtml = `
      <ul>
        <li>총 플로우 수: ${metrics.flow_count ?? "-"}</li>
        <li>패킷 총합: ${metrics.packet_count_sum ?? "-"}</li>
        <li>바이트 총합: ${metrics.byte_count_sum ?? "-"}</li>
        <li>초당 플로우 수: ${metrics.flow_start_rate ?? "-"}</li>
        <li>출발지 IP 수: ${metrics.src_ip_nunique ?? "-"}</li>
        <li>도착지 IP 수: ${metrics.dst_ip_nunique ?? "-"}</li>
        <li>목적지 포트 수: ${metrics.dst_port_nunique ?? "-"}</li>
      </ul>
    `

    // ✅ 관리자 대시보드 링크 (환경변수 또는 기본값)
    const dashboardUrl =
      process.env.DASHBOARD_URL || "https://network-security-service-ma6i.vercel.app"

    // ✅ 이메일 본문
    const html = `
      <h2>🚨 보안 이벤트가 감지되었습니다</h2>
      <p><strong>탐지 결과:</strong> ${incident.detection_result}</p>
      <p><strong>카테고리:</strong> ${category}</p>
      <p><strong>신뢰도(Confidence):</strong> ${incident.confidence}</p>
      <p><strong>발생 시각:</strong> ${format(
        new Date(incident.time || new Date()),
        "yyyy-MM-dd HH:mm:ss"
      )}</p>

      <h4>📊 주요 탐지 지표</h4>
      ${metricHtml}

      <hr/>
      <p>
        🔗 <a href="${dashboardUrl}" target="_blank" rel="noopener noreferrer">
        관리자 대시보드</a>에서 상세 내역을 확인하세요.
      </p>
    `

    // ✅ 이메일 전송
    const info = await transporter.sendMail({
      from: process.env.REPORT_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    })

    console.log(`✅ [SMTP] Email sent successfully: ${info.messageId}`)
  } catch (err: any) {
    const msg = err?.message || err?.toString?.() || "Unknown email send error"
    console.error("❌ [SMTP Email Error]:", msg)
    console.error("📜 Full Error Object:", err)
    throw err
  }
}
