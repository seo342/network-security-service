import { NextResponse } from "next/server"
import { jsPDF } from "jspdf"
import fs from "fs"
import path from "path"

export async function POST(req: Request) {
  try {
    const { format, category, api_key_name, data } = await req.json()

    console.log("📥 [IncidentReports] 요청 수신:", {
      format,
      category,
      api_key_name,
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

    // ✅ PDF 헤더
    let y = 20
    const marginLeft = 14
    doc.setFontSize(16)
    doc.text("보안 사고 리포트", marginLeft, y)
    y += 10
    doc.setFontSize(10)
    doc.text(`생성 시각: ${new Date().toLocaleString("ko-KR")}`, marginLeft, y)
    y += 6
    doc.text(`카테고리: ${category}`, marginLeft, y)
    y += 6
    doc.text(`API 키 이름: ${api_key_name || "전체"}`, marginLeft, y)
    y += 10

    // ✅ 데이터 렌더링
    data.forEach((incident: any, idx: number) => {
      if (y > 270) {
        doc.addPage()
        y = 20
      }

      doc.setFontSize(12)
      doc.text(`${idx + 1}. [${incident["카테고리"] || "-"}] ${incident["탐지 결과"] || "-"}`, marginLeft, y)
      y += 8

      doc.setFontSize(10)
      doc.text(`상태: ${incident["상태"] || "-"}`, marginLeft, y)
      y += 5
      doc.text(`탐지 시각: ${incident["탐지 시각"] || "-"}`, marginLeft, y)
      y += 8

      // ✅ 섹션별 데이터 출력
      const sections = [
        { title: "① 핵심 지표 (Core Metrics)", data: incident["핵심 지표 (Core Metrics)"] },
        { title: "② 프로토콜 신호 (Protocol Signals)", data: incident["프로토콜 신호 (Protocol Signals)"] },
        { title: "③ 소스 분석 (Source Analysis)", data: incident["소스 분석 (Source Analysis)"] },
        { title: "④ 탐지 확률 (All Probabilities)", data: incident["탐지 확률 (All Probabilities)"] },
      ]

      sections.forEach((section) => {
        if (!section.data || Object.keys(section.data).length === 0) return
        if (y > 270) {
          doc.addPage()
          y = 20
        }

        doc.setFontSize(11)
        doc.text(section.title, marginLeft, y)
        y += 6
        doc.setFontSize(9)

        for (const [key, value] of Object.entries(section.data)) {
          if (y > 280) {
            doc.addPage()
            y = 20
          }
          if (typeof value === "object" && value !== null) {
            // 하위 항목 (예: amplification_ports_hits)
            doc.text(`${key}:`, marginLeft + 4, y)
            y += 5
            for (const [subKey, subValue] of Object.entries(value)) {
              doc.text(`• ${subKey}: ${subValue}`, marginLeft + 10, y)
              y += 5
            }
          } else {
            doc.text(`• ${key}: ${value}`, marginLeft + 4, y)
            y += 5
          }
        }

        y += 6
      })

      doc.setFontSize(9)
      doc.text("──────────────────────────────────────────────", marginLeft, y)
      y += 6
    })

    // ✅ PDF 출력
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
