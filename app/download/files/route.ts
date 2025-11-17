import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") // only pdf allowed

  // PDF만 내부에서 제공
  if (type !== "pdf") {
    return NextResponse.json(
      { error: "PDF만 다운로드 가능합니다. EXE는 GitHub Releases에서 받으세요." },
      { status: 400 }
    )
  }

  const filePath = path.join(process.cwd(), "public", "files", "manual.pdf")

  try {
    const fileBuffer = fs.readFileSync(filePath)

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="manual.pdf"',
      },
    })
  } catch (err) {
    console.error("PDF 파일 읽기 오류:", err)
    return NextResponse.json({ error: "PDF 파일을 찾을 수 없습니다." }, { status: 404 })
  }
}
