import nodemailer from "nodemailer"
import { format } from "date-fns"

// ======================================================
// ✅ SMTP 기반 즉시 위협 알림 메일 (Resend 제거 버전)
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

    const to = [userEmail]
    const subject = `[⚠️ 위협 감지] ${incident.detection_result} (${incident.source_ip} → ${incident.destination_ip})`

    const html = `
      <h2>🚨 보안 위협이 감지되었습니다</h2>
      <p><strong>탐지 결과:</strong> ${incident.detection_result}</p>
      <p><strong>심각도:</strong> ${incident.severity}</p>
      <p><strong>신뢰도(Confidence):</strong> ${incident.confidence}</p>
      <p><strong>발생 시각:</strong> ${format(new Date(incident.time || new Date()), "yyyy-MM-dd HH:mm:ss")}</p>
      <p><strong>출발지:</strong> ${incident.source_ip}</p>
      <p><strong>목적지:</strong> ${incident.destination_ip}:${incident.destination_port}</p>
      <hr/>
      <p>📊 관리자 대시보드에서 상세 내역을 확인하세요.</p>
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
