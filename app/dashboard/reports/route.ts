import { NextResponse } from "next/server"
import { jsPDF } from "jspdf"
import fs from "fs"
import path from "path"

export async function POST(req: Request) {
  try {
    const { format, category, api_key_id, data } = await req.json()

    console.log("📥 [IncidentReports] 요청 수신:", {
      format,
      category,
      api_key_id,
      dataLength: data?.length,
    })

    if (format !== "pdf")
      return NextResponse.json({ error: "PDF 형식만 지원합니다." }, { status: 400 })

    if (!data || data.length === 0)
      return NextResponse.json({ message: "데이터가 없습니다." }, { status: 200 })

    // ✅ NotoSansKR-Regular 폰트 로드
    const fontPath = path.join(process.cwd(), "public", "fonts", "NotoSansKR-Regular.ttf")
    if (!fs.existsSync(fontPath)) {
      throw new Error("폰트 파일이 없습니다. public/fonts/NotoSansKR-Regular.ttf 를 추가하세요.")
    }

    const fontBuffer = fs.readFileSync(fontPath)
    const fontBase64 = fontBuffer.toString("base64")

    // ✅ jsPDF 생성
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      putOnlyUsedFonts: true,
      compress: true,
    })

    // ✅ 폰트 등록
    doc.addFileToVFS("NotoSansKR-Regular.ttf", fontBase64)
    doc.addFont("NotoSansKR-Regular.ttf", "NotoSansKR", "normal")
    doc.setFont("NotoSansKR")

    // ✅ PDF 내용 작성
    let y = 20
    const marginLeft = 14
    doc.setFontSize(16)
    doc.text("보안 사고 리포트", marginLeft, y)
    y += 10
    doc.setFontSize(10)
    doc.text(`생성 시각: ${new Date().toLocaleString("ko-KR")}`, marginLeft, y)
    y += 8
    doc.text(`카테고리: ${category}`, marginLeft, y)
    y += 8
    doc.text(`API 키 ID: ${api_key_id || "전체"}`, marginLeft, y)
    y += 10

    data.forEach((row: any, idx: number) => {
      if (y > 270) {
        doc.addPage()
        y = 20
      }

      const time = new Date(row.time).toLocaleString("ko-KR")
      const ip = row.source_ip || "-"
      const country = row.country || "-"
      const status = row.status || "-"
      const detection = row.detection_result || "-"
      const categoryText = row.category || "-"

      doc.setFontSize(12)
      doc.text(`${idx + 1}. [${categoryText}] ${detection}`, marginLeft, y)
      y += 6
      doc.setFontSize(10)
      doc.text(`   발생 시각: ${time}`, marginLeft, y)
      y += 5
      doc.text(`   출발지 IP: ${ip}`, marginLeft, y)
      y += 5
      doc.text(`   국가: ${country}`, marginLeft, y)
      y += 5
      doc.text(`   상태: ${status}`, marginLeft, y)
      y += 8
    })

    const pdfBytes = doc.output("arraybuffer")

    console.log(`✅ [IncidentReports] PDF 생성 완료 (${category}) / ${data.length}건`)

    // ✅ 파일명 한글 인코딩 안전 처리
    const encodedFilename = encodeURIComponent(`incident_report_${category}.pdf`)

    return new Response(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodedFilename}`,
      },
    })
  } catch (err: any) {
    console.error("❌ Error generating incident report:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
