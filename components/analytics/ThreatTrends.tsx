"use client"

import React, { useEffect, useMemo, useState } from "react"
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
import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ThreatTrend {
  date: string
  [key: string]: string | number
}

interface AttackType {
  name: string
  value: number
  color: string
  [key:string]:string|number
}

interface ThreatTrendsProps {
  apiKeyId: string
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ✅ 라벨 목록 + 색상 매핑
const LABELS = [
  "정상",
  "ICMP_FLOOD",
  "OTHER_TCP_FLOOD",
  "Port_Scan",
  "SYN_FLOOD",
  "Slowloris_Attack",
  "UDP_AMPLIFY",
  "UDP_FLOOD",
]

const LABEL_COLORS: Record<string, string> = {
  정상: "#22c55e",
  ICMP_FLOOD: "#ef4444",
  OTHER_TCP_FLOOD: "#f97316",
  Port_Scan: "#eab308",
  SYN_FLOOD: "#3b82f6",
  Slowloris_Attack: "#a855f7",
  UDP_AMPLIFY: "#06b6d4",
  UDP_FLOOD: "#f43f5e",
}

export default function ThreatTrends({ apiKeyId }: ThreatTrendsProps) {
  const [trendData, setTrendData] = useState<ThreatTrend[]>([])
  const [attackTypeData, setAttackTypeData] = useState<AttackType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ✅ incidents 테이블 기반 데이터 로드
  const fetchData = async () => {
    try {
      if (!apiKeyId) {
        setError("API 키가 제공되지 않았습니다.")
        return
      }

      // incidents 테이블에서 detection_result별 집계
      const { data: incidents, error } = await supabase
        .from("incidents")
        .select("time, detection_result")
        .eq("api_key_id", apiKeyId)
        .order("time", { ascending: true })
        .limit(500)

      if (error) throw error

      if (!incidents || incidents.length === 0) {
        setTrendData([])
        setAttackTypeData([])
        setLoading(false)
        return
      }

      // ---------- 시간대별 라벨 카운트 ----------
      const hourMap: Record<string, Record<string, number>> = {}

      for (const it of incidents) {
        const time = new Date(it.time)
        const hour = `${time.getHours().toString().padStart(2, "0")}:00`
        const label = it.detection_result ?? "BENIGN"

        const mappedLabel = label === "BENIGN" ? "정상" : label
        if (!LABELS.includes(mappedLabel)) continue

        if (!hourMap[hour]) {
          hourMap[hour] = Object.fromEntries(LABELS.map((l) => [l, 0]))
        }
        hourMap[hour][mappedLabel]++
      }

      const chartArray: ThreatTrend[] = Object.entries(hourMap).map(
        ([hour, counts]) => ({
          date: hour,
          ...counts,
        })
      )

      chartArray.sort((a, b) => (a.date > b.date ? 1 : -1))
      setTrendData(chartArray)

      // ---------- 전체 공격 유형 분포 ----------
      const totals: Record<string, number> = Object.fromEntries(
        LABELS.map((l) => [l, 0])
      )
      for (const it of incidents) {
        const mappedLabel = it.detection_result === "BENIGN" ? "정상" : it.detection_result
        if (LABELS.includes(mappedLabel)) totals[mappedLabel]++
      }

      const pieArray: AttackType[] = LABELS.map((l) => ({
        name: l,
        value: totals[l],
        color: LABEL_COLORS[l],
      })).filter((i) => i.value > 0)

      setAttackTypeData(pieArray)
      setError(null)
    } catch (err: any) {
      console.error("❌ ThreatTrends fetch error:", err.message)
      setError("데이터를 불러올 수 없습니다.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [apiKeyId])

  const chartData = useMemo(() => trendData, [trendData])
  const pieData = useMemo(() => attackTypeData, [attackTypeData])

  if (loading)
    return (
      <div className="flex justify-center items-center h-[400px] text-muted-foreground">
        ⏳ 위협 트렌드 로딩 중...
      </div>
    )

  if (error)
    return (
      <div className="flex justify-center items-center h-[400px] text-red-500">
        ⚠️ {error}
      </div>
    )

  return (
    <div className="space-y-6 transition-all">
      {/* ▣ 위협 탐지 동향 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>위협 탐지 동향</CardTitle>
            <CardDescription>시간별 공격 라벨 분포</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                {LABELS.map(
                  (label) =>
                    chartData.length > 0 && (
                      <Area
                        key={label}
                        type="monotone"
                        dataKey={label}
                        stackId="1"
                        stroke={LABEL_COLORS[label]}
                        fill={LABEL_COLORS[label]}
                        fillOpacity={0.5}
                        name={label}
                      />
                    )
                )}
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ▣ 공격 유형별 분포 */}
        <Card>
          <CardHeader>
            <CardTitle>공격 유형별 분포</CardTitle>
            <CardDescription>탐지된 라벨 비율</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {pieData.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ▣ 공격 유형별 상세 동향 */}
      <Card>
        <CardHeader>
          <CardTitle>공격 유형별 상세 동향</CardTitle>
          <CardDescription>라벨별 시간 추이 분석</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              {LABELS.map(
                (label) =>
                  chartData.length > 0 && (
                    <Line
                      key={label}
                      type="monotone"
                      dataKey={label}
                      stroke={LABEL_COLORS[label]}
                      strokeWidth={2}
                      name={label}
                    />
                  )
              )}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
