"use client"

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

interface TrafficChartProps {
  data: ChartData[]
}

/**
 * 실시간 트래픽 모니터링 차트 컴포넌트
 * - 요청 수, 위협 탐지를 라인 차트로 표시
 * - recharts 기반
 */
export default function TrafficChart({ data }: TrafficChartProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>실시간 트래픽 모니터링</CardTitle>
        <CardDescription>시간별 요청 수와 위협 탐지 현황</CardDescription>
      </CardHeader>
      <CardContent>
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
            />
            <Line
              type="monotone"
              dataKey="threats"
              stroke="hsl(var(--destructive))"
              strokeWidth={2}
              name="위협 탐지"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
