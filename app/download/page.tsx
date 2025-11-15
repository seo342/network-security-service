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
import { Download, FileType, FileArchive } from "lucide-react"

export default function DownloadPage() {
  const [loading, setLoading] = useState<"" | "exe" | "pdf">("")

  const downloadFile = async (type: "exe" | "pdf") => {
    setLoading(type)

    const res = await fetch(`/download/files?type=${type}`)

    if (!res.ok) {
      alert("❌ 다운로드 실패!")
      setLoading("")
      return
    }

    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = type === "exe" ? "AION Sentinel.exe" : "manual.pdf"
    a.click()

    setLoading("")
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* 다운로드 설명 카드 */}
      <Card>
        <CardHeader>
          <CardTitle>파일 다운로드</CardTitle>
          <CardDescription>
            AION Sentinel 설치 파일 및 문서를 다운로드하세요.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">

          {/* EXE */}
          <div>
            <h4 className="font-semibold">AION Sentinel 설치 프로그램</h4>
            <p className="text-sm text-muted-foreground">
              Windows용 보안 모니터링 실행 프로그램입니다.
            </p>

            <Button
              className="mt-3 flex items-center gap-2"
              onClick={() => downloadFile("exe")}
              disabled={loading === "exe"}
            >
              <Download className="h-4 w-4" />
              {loading === "exe" ? "다운로드 중..." : "EXE 다운로드"}
            </Button>
          </div>

          {/* PDF */}
          <div className="pt-5 border-t">
            <h4 className="font-semibold">사용 설명서 (PDF)</h4>
            <p className="text-sm text-muted-foreground">
              설치 및 사용 가이드 문서입니다.
            </p>

            <Button
              className="mt-3 flex items-center gap-2"
              variant="outline"
              onClick={() => downloadFile("pdf")}
              disabled={loading === "pdf"}
            >
              <FileType className="h-4 w-4" />
              {loading === "pdf" ? "다운로드 중..." : "PDF 다운로드"}
            </Button>
          </div>

        </CardContent>
      </Card>

      {/* 구성 요소 안내 카드 */}
      <Card>
        <CardHeader>
          <CardTitle>포함된 파일 안내</CardTitle>
          <CardDescription>AION Sentinel 다운로드 구성</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <FileArchive className="h-5 w-5 text-primary" />
            <div>
              <div className="font-medium">AION Sentinel.exe</div>
              <div className="text-sm text-muted-foreground">
                보안 위협 분석 실행 프로그램
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <FileType className="h-5 w-5 text-accent" />
            <div>
              <div className="font-medium">manual.pdf</div>
              <div className="text-sm text-muted-foreground">
                설치 & 사용 설명서
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
