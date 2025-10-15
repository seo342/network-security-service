import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseServiceClient"
import { createObjectCsvStringifier } from "csv-writer"
import { jsPDF } from "jspdf"
import fs from "fs"
import path from "path"

export async function POST(req: Request) {
  try {
    const { period, format } = await req.json()

    // 🔹 기간 계산
    const now = new Date()
    const start = new Date()
    if (period === "7d") start.setDate(now.getDate() - 7)
    else if (period === "30d") start.setDate(now.getDate() - 30)
    else if (period === "90d") start.setDate(now.getDate() - 90)
    else if (period === "1y") start.setFullYear(now.getFullYear() - 1)

    const { data, error } = await supabaseAdmin
      .from("api_usage")
      .select(`
        id,
        api_key_id,
        endpoint,
        requests,
        threats,
        created_at,
        last_used,
        api_keys:api_key_id (name, auth_key)
      `)
      .gte("created_at", start.toISOString())
      .order("created_at", { ascending: false })

    if (error) throw new Error(error.message)
    if (!data || data.length === 0) {
      return NextResponse.json({ message: "No usage data found." }, { status: 200 })
    }

    // 🔹 PDF 형식 처리
    if (format === "pdf") {
      const doc = new jsPDF()
      const fontPath = path.join(process.cwd(), "public", "fonts", "NotoSansKR-VariableFont_wght.ttf")
      const fontData = fs.readFileSync(fontPath, "base64")

      // ✅ 한글 폰트 등록
      doc.addFileToVFS("NotoSansKR-VariableFont_wght.ttf", fontData)
      doc.addFont("NotoSansKR-VariableFont_wght.ttf", "NotoSansKR", "normal")
      doc.setFont("NotoSansKR")

      let y = 20
      const marginLeft = 14
      doc.setFontSize(16)
      doc.text("📊 API 사용 리포트", marginLeft, y)
      y += 10
      doc.setFontSize(10)
      doc.text(`생성 시각: ${new Date().toLocaleString()}`, marginLeft, y)
      y += 10

      data.forEach((row: any, idx: number) => {
        if (y > 270) {
          doc.addPage()
          y = 20
        }

        const name = row.api_keys?.name || "N/A"
        const endpoint = row.endpoint || "-"
        const requests = row.requests ?? 0
        const threats = row.threats ?? 0
        const createdAt = new Date(row.created_at).toLocaleString()
        const lastUsed = new Date(row.last_used).toLocaleString()

        doc.text(
          `${idx + 1}. [${name}] ${endpoint} → ${requests} 요청 / ${threats} 위협`,
          marginLeft,
          y
        )
        y += 6
        doc.text(`   생성일: ${createdAt} | 마지막 사용: ${lastUsed}`, marginLeft, y)
        y += 8
      })

      const pdfBytes = doc.output("arraybuffer")
      return new Response(pdfBytes, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": "attachment; filename=api_usage_report.pdf",
        },
      })
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 })
  } catch (err: any) {
    console.error("❌ Error generating report:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
