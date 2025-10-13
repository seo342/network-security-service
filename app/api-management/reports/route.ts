import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseServiceClient"
import { createObjectCsvStringifier } from "csv-writer"
import { jsPDF } from "jspdf"

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

    // 🔹 DB 조회 (api_usage + api_keys 조인)
    const { data, error } = await supabaseAdmin
      .from("api_usage")
      .select("id, api_key_id, endpoint, requests, threats, created_at, api_keys(name, api_key)")
      .gte("created_at", start.toISOString())

    if (error) throw new Error(error.message)

    // 🔹 형식별 파일 생성
    if (format === "json") {
      return new Response(JSON.stringify(data, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": "attachment; filename=api_usage_report.json",
        },
      })
    }

    if (format === "csv") {
      const csvWriter = createObjectCsvStringifier({
        header: [
          { id: "id", title: "ID" },
          { id: "api_key_id", title: "API Key ID" },
          { id: "api_key_name", title: "Key Name" },
          { id: "endpoint", title: "Endpoint" },
          { id: "requests", title: "Requests" },
          { id: "threats", title: "Threats" },
          { id: "created_at", title: "Created At" },
        ],
      })

      const csvContent =
        csvWriter.getHeaderString() +
        csvWriter.stringifyRecords(
          data.map((row: any) => ({
            id: row.id,
            api_key_id: row.api_key_id,
            api_key_name: row.api_keys?.name || "",
            endpoint: row.endpoint,
            requests: row.requests,
            threats: row.threats,
            created_at: row.created_at,
          }))
        )

      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=api_usage_report.csv",
        },
      })
    }

    if (format === "pdf") {
      const doc = new jsPDF()
      doc.text("API Usage Report", 14, 15)
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25)
      data.forEach((row: any, idx: number) => {
        doc.text(`${idx + 1}. ${row.api_keys?.name} (${row.endpoint}) - ${row.requests} req`, 14, 35 + idx * 8)
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
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
