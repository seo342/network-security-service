import { Resend } from "resend"
import nodemailer from "nodemailer"
import { format } from "date-fns"

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const transporter =
  !resend && process.env.SMTP_HOST
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT || 587) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    : null

// ======================================================
// ✅ 즉시 위협 알림 메일 (사용자에게 전송)
// ======================================================
export async function sendImmediateAlertEmail(incident: any, userEmail: string) {
  try {
    if (!userEmail) throw new Error("User email is required for alert email")

    const to = [userEmail] // ✅ 이제 환경변수 대신 사용자 이메일 사용
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

    // ✅ Resend 우선
    if (resend) {
      const result = await resend.emails.send({
        from: process.env.REPORT_FROM || "alert@network-security-service.app",
        to,
        subject,
        html,
      })
      console.log("✅ [Resend] Email sent:", result)
      return
    }

    // ✅ SMTP fallback
    if (transporter) {
      await transporter.sendMail({
        from: process.env.REPORT_FROM,
        to,
        subject,
        html,
      })
      console.log("✅ [SMTP] Email sent via transporter")
    } else {
      console.warn("⚠️ [No Email Service Configured] 이메일 발송 설정이 없습니다.")
    }
  } catch (err: any) {
    console.error("❌ [sendImmediateAlertEmail Error]:", err.message)
    throw err
  }
}
