"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { BarChart3, Shield, Calendar, Download } from "lucide-react"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ApiKey {
  id: number
  name: string
  key: string
  requests: number
}

export default function ApiUsage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("30d")
  const [format, setFormat] = useState("csv")

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
        .from("api_keys")
        .select("id, name, auth_key, api_usage(requests)")
      setApiKeys(
        data?.map((i: any) => ({
          id: i.id,
          name: i.name,
          key: i.auth_key,
          requests: i.api_usage?.reduce((s: number, u: any) => s + (u.requests || 0), 0) || 0,
        })) || []
      )
      setLoading(false)
    }
    fetchData()
  }, [])

  const handleDownload = async () => {
    const res = await fetch("/api-management/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ period, format }),
    })
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `api_usage_report.${format}`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) return <div>데이터 불러오는 중...</div>

  return (
    <div className="space-y-6">
            {/* API 키별 사용량 */}
      <Card>
        <CardHeader>
          <CardTitle>API 키별 사용량</CardTitle>
          <CardDescription>각 API 키의 월별 사용량</CardDescription>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-sm text-muted-foreground">등록된 API 키가 없습니다.</div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <div
                  key={apiKey.id}
                  className="flex items-center justify-between p-4 border border-border/50 rounded-lg"
                >
                  <div>
                    <div className="font-medium">{apiKey.name}</div>
                    <div className="text-sm text-muted-foreground">{apiKey.key}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{apiKey.requests.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">요청</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 리포트 카드 */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>사용량 리포트</CardTitle>
            <CardDescription>상세한 분석 리포트를 다운로드</CardDescription>
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
