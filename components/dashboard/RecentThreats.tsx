"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin } from "lucide-react"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ThreatItem {
  id: number
  ip: string
  country: string
  status: string
  time: string
  severity: string
}

/**
 * ✅ 최근 위협 활동 컴포넌트
 * - incidents 테이블에서 최근 5개 레코드
 * - apiKeyId로 필터링
 */
export default function RecentThreats({ apiKeyId }: { apiKeyId: string }) {
  const [threats, setThreats] = useState<ThreatItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ✅ timestamp 포맷
  const formatTime = (timestamp: string) => {
    if (!timestamp) return "-"
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return "-"
    const pad = (n: number) => n.toString().padStart(2, "0")
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  }

  // ✅ Supabase 데이터 불러오기
  const fetchThreats = async () => {
    try {
      if (!apiKeyId) return

      const { data, error } = await supabase
        .from("incidents")
        .select("id, source_ip, country, status, severity, time")
        .eq("api_key_id", apiKeyId)
        .order("time", { ascending: false })
        .limit(5)

      if (error) throw error

      const mapped = (data || []).map((item) => ({
        id: item.id,
        ip: item.source_ip ?? "-",
        country: item.country ?? "알 수 없음",
        status: item.status ?? "-",
        time: formatTime(item.time),
        severity: item.severity ?? "unknown",
      }))

      setThreats(mapped)
      setError(null)
    } catch (err: any) {
      console.error("🚨 RecentThreats fetch 실패:", err.message)
      setError("서버에서 데이터를 불러올 수 없습니다.")
    } finally {
      setLoading(false)
    }
  }

  // ✅ 10초마다 자동 갱신
  useEffect(() => {
    fetchThreats()
    const interval = setInterval(fetchThreats, 10000)
    return () => clearInterval(interval)
  }, [apiKeyId])

  return (
    <Card>
      <CardHeader>
        <CardTitle>최근 위협 활동</CardTitle>
        <CardDescription>
          {apiKeyId
            ? `API 키 ${apiKeyId} 기준 실시간 위협 탐지 로그`
            : "API 키가 선택되지 않았습니다."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-red-500 text-sm">{error}</p>
        ) : loading ? (
          <p className="text-muted-foreground text-sm">⏳ 불러오는 중...</p>
        ) : threats.length === 0 ? (
          <p className="text-sm text-muted-foreground">최근 위협 기록이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {threats.map((threat) => (
              <div
                key={threat.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition"
              >
                {/* IP + 국가 */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-sm">{threat.ip}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {threat.country}
                  </Badge>
                </div>

                {/* 상태 + 시간 */}
                <div className="flex items-center gap-2">
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
                    {threat.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{threat.time}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
