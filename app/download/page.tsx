"use client"

import { useState } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileType } from "lucide-react"

export default function DownloadPage() {
  const [loading, setLoading] = useState<"" | "exe" | "pdf">("")

  // ================================
  // 📌 PDF 다운로드 (local 파일)
  // ================================
  const downloadPdf = async () => {
    setLoading("pdf")

    const res = await fetch(`/download/files?type=pdf`)

    if (!res.ok) {
      alert("❌ PDF 다운로드 실패!")
      setLoading("")
      return
    }

    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = "manual.pdf"
    a.click()

    URL.revokeObjectURL(url)
    setLoading("")
  }

  // ================================
  // 📌 EXE 다운로드 (PUBLIC URL)
  // ================================
  const downloadExe = () => {
    const publicUrl =
      "https://wdxkumdiyixkyqwbrwvh.supabase.co/storage/v1/object/public/file/AION_Sentinel.exe"

    // 그냥 퍼블릭 URL로 이동 = 즉시 다운로드
    window.location.href = publicUrl
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>파일 다운로드</CardTitle>
          <CardDescription>
            AION Sentinel 설치 파일 및 문서를 다운로드하세요.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* ============================ */}
          {/* EXE 다운로드 버튼 */}
          {/* ============================ */}
          <div>
            <h4 className="font-semibold">AION Sentinel 설치 프로그램</h4>
            <p className="text-sm text-muted-foreground">
              Windows용 보안 모니터링 실행 프로그램입니다.
            </p>

            <Button
              className="mt-3 flex items-center gap-2"
              onClick={downloadExe}
            >
              <Download className="h-4 w-4" />
              EXE 다운로드
            </Button>
          </div>

          {/* ============================ */}
          {/* PDF 다운로드 버튼 */}
          {/* ============================ */}
          <div className="pt-5 border-t">
            <h4 className="font-semibold">사용 설명서 (PDF)</h4>
            <p className="text-sm text-muted-foreground">
              설치 및 사용 가이드 문서입니다.
            </p>

            <Button
              className="mt-3 flex items-center gap-2"
              variant="outline"
              onClick={downloadPdf}
              disabled={loading === "pdf"}
            >
              <FileType className="h-4 w-4" />
              {loading === "pdf" ? "다운로드 중..." : "PDF 다운로드"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
