"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Download } from "lucide-react"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ApiUsageData {
  id: number
  name: string
  key: string
  requests: number
  description:string
}

/**
 * ✅ 특정 API 키별 사용량 표시 및 리포트 다운로드
 * - apiKeyId를 기반으로 해당 키만 표시
 */
export default function ApiUsage({ apiKeyId }: { apiKeyId: string }) {
  const [usage, setUsage] = useState<ApiUsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("30d")
  const [format, setFormat] = useState("csv")

  useEffect(() => {
    async function fetchUsage() {
      if (!apiKeyId) return
      setLoading(true)
      try {
        // ✅ Supabase에서 해당 API 키만 조회
        const { data, error } = await supabase
          .from("api_keys")
          .select("id, name, auth_key, api_usage(requests),description")
          .eq("id", apiKeyId)
          .single()

        if (error) throw error

        const totalRequests =
          data.api_usage?.reduce((sum: number, item: any) => sum + (item.requests || 0), 0) || 0

        setUsage({
          id: data.id,
          name: data.name,
          key: data.auth_key,
          requests: totalRequests,
          description:data.description,
        })
      } catch (err) {
        console.error("❌ API 사용량 불러오기 실패:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchUsage()
  }, [apiKeyId])

  // ✅ 리포트 다운로드
  const handleDownload = async () => {
    const res = await fetch("/api-management/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ period, format, api_key_id: apiKeyId }), // ✅ 특정 키 전달
    })
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `api_usage_${apiKeyId}.${format}`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) return <div>🔄 사용량 불러오는 중...</div>
  if (!usage) return <div className="text-sm text-muted-foreground">해당 API 키 사용 내역이 없습니다.</div>

  return (
    <div className="space-y-6">
      {/* 단일 API 키 사용량 */}
      <Card>
        <CardHeader>
          <CardTitle>API 키 사용량</CardTitle>
          <CardDescription>이 키의 최근 요청 통계</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
            <div>
              <div className="font-medium">{usage.name}</div>
              <div className="text-sm text-muted-foreground">{usage.description}</div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-lg">{usage.requests.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">총 요청 수</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 리포트 다운로드 */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>사용량 리포트</CardTitle>
            <CardDescription>해당 API 키의 분석 리포트를 다운로드</CardDescription>
          </div>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            리포트 다운로드
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>리포트 기간</Label>
              <select
                className="w-full p-2 border border-border rounded-md bg-background"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <option value="7d">지난 7일</option>
                <option value="30d">지난 30일</option>
                <option value="90d">지난 3개월</option>
                <option value="1y">지난 1년</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>리포트 형식</Label>
              <select
                className="w-full p-2 border border-border rounded-md bg-background"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
              >
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
