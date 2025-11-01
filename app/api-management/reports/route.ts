import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseServiceClient"
import { createObjectCsvStringifier } from "csv-writer"
import { jsPDF } from "jspdf"
import fs from "fs"
import path from "path"

export async function POST(req: Request) {
  try {
    const { period, format, api_key_id } = await req.json() // ✅ 특정 키 ID 받기

    // 🔹 기간 계산
    const now = new Date()
    const start = new Date()
    switch (period) {
      case "7d":
        start.setDate(now.getDate() - 7)
        break
      case "30d":
        start.setDate(now.getDate() - 30)
        break
      case "90d":
        start.setDate(now.getDate() - 90)
        break
      case "1y":
        start.setFullYear(now.getFullYear() - 1)
        break
      default:
        start.setDate(now.getDate() - 30)
    }

    // ✅ Supabase 쿼리
    let query = supabaseAdmin
      .from("api_usage")
      .select(
        `
        id,
        api_key_id,
        endpoint,
        requests,
        threats,
        created_at,
        last_used,
        api_keys:api_key_id (
          name,
          status,
          auth_key,
          description
        )
      `
      )
      .gte("created_at", start.toISOString())
      .order("created_at", { ascending: false })

    // ✅ 특정 키만 필터링
    if (api_key_id) query = query.eq("api_key_id", api_key_id)

    const { data, error } = await query

    if (error) throw new Error(error.message)
    if (!data || data.length === 0) {
      return NextResponse.json({ message: "No usage data found." }, { status: 200 })
    }

    // ✅ JSON 형식
    if (format === "json") {
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="api_usage_report.json"`,
        },
      })
    }

    // ✅ CSV 형식
    if (format === "csv") {
      const csvStringifier = createObjectCsvStringifier({
        header: [
          { id: "id", title: "ID" },
          { id: "api_key_id", title: "API Key ID" },
          { id: "endpoint", title: "Endpoint" },
          { id: "requests", title: "Requests" },
          { id: "threats", title: "Threats" },
          { id: "created_at", title: "Created At" },
          { id: "last_used", title: "Last Used" },
          { id: "api_keys.name", title: "API Key Name" },
          { id: "api_keys.status", title: "Status" },
          { id: "api_keys.description", title: "Description" },
        ],
      })

      // Supabase nested key (`api_keys.name`) 풀어서 변환
      const flatData = data.map((row: any) => ({
        id: row.id,
        api_key_id: row.api_key_id,
        endpoint: row.endpoint,
        requests: row.requests,
        threats: row.threats,
        created_at: row.created_at,
        last_used: row.last_used,
        "api_keys.name": row.api_keys?.name,
        "api_keys.status": row.api_keys?.status,
        "api_keys.description": row.api_keys?.description || "-",
      }))

      const csvContent =
        csvStringifier.getHeaderString() +
        csvStringifier.stringifyRecords(flatData || [])

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="api_usage_report.csv"`,
        },
      })
    }

    // ✅ PDF 형식
    if (format === "pdf") {
      const doc = new jsPDF()
      const fontPath = path.join(process.cwd(), "public", "fonts", "NotoSansKR-VariableFont_wght.ttf")

      if (!fs.existsSync(fontPath)) {
        throw new Error("폰트 파일이 없습니다. public/fonts 폴더에 NotoSansKR.ttf를 추가하세요.")
      }

      const fontData = fs.readFileSync(fontPath, "base64")
      doc.addFileToVFS("NotoSansKR.ttf", fontData)
      doc.addFont("NotoSansKR.ttf", "NotoSansKR", "normal")
      doc.setFont("NotoSansKR")

      let y = 20
      const marginLeft = 14
      doc.setFontSize(16)
      doc.text("📊 API 사용 리포트", marginLeft, y)
      y += 10
      doc.setFontSize(10)
      doc.text(`생성 시각: ${new Date().toLocaleString("ko-KR")}`, marginLeft, y)
      y += 10

      data.forEach((row: any, idx: number) => {
        if (y > 270) {
          doc.addPage()
          y = 20
        }

        const name = row.api_keys?.name || "N/A"
        const desc = row.api_keys?.description || "-"
        const status = row.api_keys?.status || "-"
        const endpoint = row.endpoint || "-"
        const requests = row.requests ?? 0
        const threats = row.threats ?? 0
        const createdAt = new Date(row.created_at).toLocaleString("ko-KR")
        const lastUsed = row.last_used
          ? new Date(row.last_used).toLocaleString("ko-KR")
          : "-"

        doc.text(`${idx + 1}. [${name}] (${status})`, marginLeft, y)
        y += 6
        doc.text(`   설명: ${desc}`, marginLeft, y)
        y += 6
        doc.text(`   엔드포인트: ${endpoint}`, marginLeft, y)
        y += 6
        doc.text(`   요청 수: ${requests}회 | 탐지된 위협: ${threats}건`, marginLeft, y)
        y += 6
        doc.text(`   생성일: ${createdAt}`, marginLeft, y)
        y += 6
        doc.text(`   마지막 사용: ${lastUsed}`, marginLeft, y)
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

    // ❌ 형식이 지정되지 않은 경우
    return NextResponse.json({ error: "Invalid format" }, { status: 400 })
  } catch (err: any) {
    console.error("❌ Error generating report:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
