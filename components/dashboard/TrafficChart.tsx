"use client"

import { useState, useEffect } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ChartData {
  time: string
  requests: number
  threats: number
}

/**
 * ✅ 실시간 트래픽 모니터링 차트 (traffic_logs 기반)
 * - Supabase traffic_logs 테이블에서 시간대별 요청/위협 수를 계산
 * - 5초마다 자동 갱신
 */
export default function TrafficChart() {
  const [data, setData] = useState<ChartData[]>([])
  const [error, setError] = useState<string | null>(null)

  // ✅ 시간 포맷 함수 (날짜 + 시간)
  const formatTime = (timestamp: string) => {
    if (!timestamp) return "-"
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return "-"
    const pad = (n: number) => n.toString().padStart(2, "0")
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  // ✅ Supabase API에서 데이터 가져오기
  const fetchData = async () => {
    try {
      const res = await fetch("/dashboard/traffic")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const logs = json.logs || []

      // ✅ 시간 단위로 그룹핑 (동일한 시각대의 요청 수, 위협 수 집계)
      const grouped: Record<string, { requests: number; threats: number }> = {}

      logs.forEach((log: any) => {
        const key = formatTime(log.time)
        if (!grouped[key]) {
          grouped[key] = { requests: 0, threats: 0 }
        }

        grouped[key].requests += 1

        const result = (log.detection_result || log.category || "").toLowerCase()
        // BENIGN, NORMAL 아닌 경우 위협으로 카운트
        if (result && !["benign", "normal"].includes(result)) {
          grouped[key].threats += 1
        }
      })

      // ✅ Recharts용 배열로 변환
      const chartData: ChartData[] = Object.entries(grouped)
        .map(([time, v]) => ({
          time,
          requests: v.requests,
          threats: v.threats,
        }))
        // 오래된 순으로 정렬
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
        // 최근 30개까지만
        .slice(-30)

      setData(chartData)
      setError(null)
    } catch (err: any) {
      console.error("🚨 트래픽 차트 fetch 실패:", err.message)
      setError("데이터를 불러올 수 없습니다.")
    }
  }

  // ✅ 5초마다 주기적 갱신
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>실시간 트래픽 모니터링</CardTitle>
        <CardDescription>시간별 요청 수와 위협 탐지 현황 (날짜+시간)</CardDescription>
      </CardHeader>

      <CardContent>
        {error ? (
          <p className="text-red-500 text-sm">{error}</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground">데이터 없음</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="time"
                tickFormatter={(value) => value.split(" ")[1] || value} // HH:mm만 보여주기
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
                connectNulls={true}
              />
              <Line
                type="monotone"
                dataKey="threats"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                name="위협 탐지"
                dot={{ r: 3, fill: "white" }}
                connectNulls={true}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
