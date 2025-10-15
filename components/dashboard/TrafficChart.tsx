"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ChartData {
  time: string
  requests: number
  threats: number
}

/**
 * ✅ 실시간 트래픽 모니터링 차트 (사용자별 traffic_logs)
 * - Supabase traffic_logs 테이블에서 시간대별 요청/위협 수 계산
 * - 5초마다 자동 갱신
 */
export default function TrafficChart() {
  const [data, setData] = useState<ChartData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // ✅ 시간 포맷 함수 (YYYY-MM-DD HH:mm)
  const formatTime = (timestamp: string) => {
    if (!timestamp) return "-"
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return "-"
    const pad = (n: number) => n.toString().padStart(2, "0")
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  // ✅ API에서 데이터 불러오기
  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("로그인이 필요합니다.")

      const res = await fetch("/dashboard/traffic", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const logs = json.logs || []

      // ✅ 시간대별 요청/위협 카운트 집계
      const grouped: Record<string, { requests: number; threats: number }> = {}

      logs.forEach((log: any) => {
        const key = formatTime(log.time)
        if (!grouped[key]) grouped[key] = { requests: 0, threats: 0 }

        grouped[key].requests += 1

        const result = (log.detection_result || log.category || "").toLowerCase()
        if (result && !["benign", "normal"].includes(result)) {
          grouped[key].threats += 1
        }
      })

      // ✅ 차트용 배열 생성 및 정렬
      const chartData: ChartData[] = Object.entries(grouped)
        .map(([time, v]) => ({
          time,
          requests: v.requests,
          threats: v.threats,
        }))
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
        .slice(-30)

      setData(chartData)
      setError(null)
    } catch (err: any) {
      console.error("🚨 트래픽 차트 fetch 실패:", err.message)
      setError(err.message || "데이터를 불러올 수 없습니다.")
    } finally {
      setLoading(false)
    }
  }

  // ✅ 5초마다 자동 갱신
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>실시간 트래픽 모니터링</CardTitle>
        <CardDescription>사용자 API 키 기반 시간별 요청/위협 탐지 현황</CardDescription>
      </CardHeader>

      <CardContent>
        {error ? (
          <p className="text-red-500 text-sm">{error}</p>
        ) : loading ? (
          <p className="text-muted-foreground text-sm">⏳ 로딩 중...</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground">데이터 없음</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="time"
                tickFormatter={(value) => value.split(" ")[1] || value}
                stroke="hsl(var(--muted-foreground))"
                angle={-30}
                textAnchor="middle"
                height={60}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                labelFormatter={(time) => time}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="requests"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                name="요청 수"
                dot={{ r: 3, fill: "black" }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="threats"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                name="위협 탐지"
                dot={{ r: 3, fill: "white" }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
