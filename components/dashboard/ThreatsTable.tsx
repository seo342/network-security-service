"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Threat {
  id: number
  time: string
  ip: string
  type: string
  status: string
  severity: string
}

/**
 * ✅ 특정 API 키 기반 위협 로그 테이블
 * - incidents 테이블에서 api_key_id로 필터링
 * - 5초마다 자동 갱신
 */
export default function ThreatTable({ apiKeyId }: { apiKeyId: string }) {
  const [threats, setThreats] = useState<Threat[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // ✅ timestamp 포맷
  const formatTime = (timestamp: string) => {
    if (!timestamp) return "-"
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return "-"
    const pad = (n: number) => n.toString().padStart(2, "0")
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `
      + `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  }

  // ✅ Supabase에서 incidents 불러오기
  const fetchThreats = async () => {
    try {
      if (!apiKeyId) return

      const { data, error } = await supabase
        .from("incidents")
        .select("id, time, source_ip, category, severity, status")
        .eq("api_key_id", apiKeyId)
        .order("time", { ascending: false })
        .limit(50)

      if (error) throw error

      const mapped = (data || []).map((item) => ({
        id: item.id,
        time: formatTime(item.time),
        ip: item.source_ip ?? "-",
        type: item.category || "Unknown",
        status: item.status || "-",
        severity: item.severity || "-",
      }))

      setThreats(mapped)
      setError(null)
    } catch (err: any) {
      console.error("🚨 incidents fetch 실패:", err.message)
      setError("서버에서 데이터를 불러올 수 없습니다.")
    } finally {
      setLoading(false)
    }
  }

  // ✅ 5초마다 자동 갱신
  useEffect(() => {
    fetchThreats()
    const interval = setInterval(fetchThreats, 5000)
    return () => clearInterval(interval)
  }, [apiKeyId])

  return (
    <Card>
      <CardHeader>
        <CardTitle>위협 분석 대시보드</CardTitle>
        <CardDescription>
          {apiKeyId
            ? `API 키 ${apiKeyId} 기준 실시간 탐지된 위협 정보`
            : "API 키가 선택되지 않았습니다."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-xs font-medium">시간</th>
                <th className="text-left p-3 text-xs font-medium">IP 주소</th>
                <th className="text-left p-3 text-xs font-medium">공격 유형</th>
                <th className="text-left p-3 text-xs font-medium">심각도</th>
                <th className="text-left p-3 text-xs font-medium">상태</th>
                <th className="text-left p-3 text-xs font-medium">작업</th>
              </tr>
            </thead>
            <tbody>
              {error ? (
                <tr>
                  <td colSpan={6} className="text-center text-red-500 py-6">
                    ⚠️ {error}
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted-foreground py-6">
                    ⏳ 로딩 중...
                  </td>
                </tr>
              ) : threats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted-foreground py-6">
                    데이터 없음
                  </td>
                </tr>
              ) : (
                threats.map((threat) => (
                  <tr
                    key={threat.id}
                    className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${
                      threat.severity === "높음" ? "bg-red-50" : ""
                    }`}
                  >
                    <td className="p-3 text-sm">{threat.time}</td>
                    <td className="p-3 font-mono text-sm">{threat.ip}</td>
                    <td className="p-3 text-sm">{threat.type}</td>
                    <td className="p-3 text-sm">
                      <Badge
                        variant={
                          threat.severity === "높음"
                            ? "destructive"
                            : threat.severity === "중간"
                            ? "secondary"
                            : "default"
                        }
                        className="text-xs"
                      >
                        {threat.severity}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm">{threat.status}</td>
                    <td className="p-3">
                      {threat.severity === "높음" && (
                        <Button size="sm" variant="destructive">
                          차단
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
