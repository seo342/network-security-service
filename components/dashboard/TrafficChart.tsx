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
 * - Supabase traffic_logs 테이블에서 요청/위협 수 가져옴
 * - 5초마다 자동 갱신
 */
export default function TrafficChart() {
  const [data, setData] = useState<ChartData[]>([])
  const [error, setError] = useState<string | null>(null)

  // ✅ PostgreSQL timestamp → HH:mm 포맷 변환 (로컬 시간대 반영)
  const formatTime = (timestamp: string) => {
    if (!timestamp) return "-"
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return "-"
    const pad = (n: number) => n.toString().padStart(2, "0")
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  // ✅ Supabase에서 데이터 fetch
  const fetchData = async () => {
    try {
      const res = await fetch("/dashboard/traffic")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const logs = json.logs || []

      // 최근 20개까지만
      const chartData = logs
        .map((log: any) => ({
          time: formatTime(log.time),
          requests: Number(log.requests) || 0,
          threats: Number(log.threats) || 0,
        }))
        .reverse() // 오래된 → 최근 순서

      setData(chartData)
      setError(null)
    } catch (err: any) {
      console.error("🚨 트래픽 차트 fetch 실패:", err.message)
      setError("데이터를 불러올 수 없습니다.")
    }
  }

  // ✅ 주기적 갱신 (5초마다)
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>실시간 트래픽 모니터링</CardTitle>
        <CardDescription>시간별 요청 수와 위협 탐지 현황</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-red-500 text-sm">{error}</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground">데이터 없음</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
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
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="threats"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                name="위협 탐지"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
