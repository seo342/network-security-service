import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")

  // Supabase 클라이언트 생성
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // ======================================
  // 2) PDF 파일: local 폴더에서 제공
  // ======================================
  if (type === "pdf") {
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
      return NextResponse.json(
        { error: "PDF 파일을 찾을 수 없습니다." },
        { status: 404 }
      )
    }
  }

  // ======================================
  // 3) 잘못된 요청
  // ======================================
  return NextResponse.json(
    { error: "type 파라미터는 pdf 또는 exe만 가능합니다." },
    { status: 400 }
  )
}
