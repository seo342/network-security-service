"use client"

import {
  AreaChart,
  Area,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ThreatTrend {
  date: string
  threats: number
  blocked: number
  ddos: number
  malware: number
  suspicious: number
}

interface AttackType {
  name: string
  value: number
  color: string
  [key:string]:string|number
}

interface ThreatTrendsProps {
  trendData: ThreatTrend[]
  attackTypeData: AttackType[]
}

/**
 * 위협 동향 차트 컴포넌트
 * - 총 위협 / 차단 현황 (AreaChart)
 * - 공격 유형별 분포 (PieChart)
 * - 공격 유형별 상세 동향 (LineChart)
 */
export default function ThreatTrends({ trendData, attackTypeData }: ThreatTrendsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 위협 탐지 동향 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>위협 탐지 동향</CardTitle>
            <CardDescription>시간별 위협 탐지 및 차단 현황</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="threats"
                  stackId="1"
                  stroke="hsl(var(--destructive))"
                  fill="hsl(var(--destructive))"
                  fillOpacity={0.6}
                  name="총 위협"
                />
                <Area
                  type="monotone"
                  dataKey="blocked"
                  stackId="2"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.6}
                  name="차단됨"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 공격 유형별 분포 */}
        <Card>
          <CardHeader>
            <CardTitle>공격 유형별 분포</CardTitle>
            <CardDescription>탐지된 공격 유형 분석</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={attackTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {attackTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {attackTypeData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 공격 유형별 상세 동향 */}
      <Card>
        <CardHeader>
          <CardTitle>공격 유형별 상세 동향</CardTitle>
          <CardDescription>각 공격 유형의 시간별 변화 추이</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Line type="monotone" dataKey="ddos" stroke="#ef4444" strokeWidth={2} name="DDoS 공격" />
              <Line type="monotone" dataKey="malware" stroke="#f97316" strokeWidth={2} name="악성코드" />
              <Line type="monotone" dataKey="suspicious" stroke="#eab308" strokeWidth={2} name="의심스러운 활동" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
