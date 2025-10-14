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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
  [key: string]: string | number
}

function ThreatTrendsInner() {
  const [trendData, setTrendData] = useState<ThreatTrend[]>([])
  const [attackTypeData, setAttackTypeData] = useState<AttackType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ✅ 데이터 불러오기
  const fetchData = async () => {
    try {
      // 1️⃣ 트래픽 로그
      const { data: traffic, error: trafficErr } = await supabase
        .from("traffic_logs")
        .select("time, threats, ddos, malware, suspicious")
        .order("time", { ascending: true })
        .limit(50)

      if (trafficErr) throw trafficErr

      const newTrendData: ThreatTrend[] = (traffic || []).map((item) => {
        const date = new Date(item.time)
        const hour = `${date.getHours().toString().padStart(2, "0")}:${date
          .getMinutes()
          .toString()
          .padStart(2, "0")}`
        return {
          date: hour,
          threats: item.threats ?? 0,
          blocked: Math.floor((item.threats ?? 0) * 0.7),
          ddos: item.ddos ?? 0,
          malware: item.malware ?? 0,
          suspicious: item.suspicious ?? 0,
        }
      })

      // ✅ 데이터 비교 후 변경된 경우만 업데이트
      setTrendData((prev) =>
        JSON.stringify(prev) === JSON.stringify(newTrendData) ? prev : newTrendData
      )

      // 2️⃣ 공격 유형 분포
      const { data: attack, error: attackErr } = await supabase
        .from("attack_types")
        .select("type, count, color")

      if (attackErr) throw attackErr

      const newAttackData: AttackType[] = (attack || []).map((a) => ({
        name: a.type,
        value: a.count ?? 0,
        color: a.color || "#3b82f6",
      }))

      setAttackTypeData((prev) =>
        JSON.stringify(prev) === JSON.stringify(newAttackData) ? prev : newAttackData
      )

      setError(null)
    } catch (err: any) {
      console.error("❌ ThreatTrends fetch error:", err.message)
      setError("데이터를 불러올 수 없습니다.")
    } finally {
      setLoading(false)
    }
  }

  // ✅ 초기 fetch + 주기적 갱신
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 8000) // 8초마다 업데이트
    return () => clearInterval(interval)
  }, [])

  // ✅ Supabase 실시간 구독 (새 로그 추가 시 자동 반영)
  useEffect(() => {
    const channel = supabase
      .channel("realtime:traffic_logs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "traffic_logs" },
        (payload) => {
          const newItem = payload.new
          const date = new Date(newItem.time)
          const hour = `${date.getHours().toString().padStart(2, "0")}:${date
            .getMinutes()
            .toString()
            .padStart(2, "0")}`

          setTrendData((prev) => {
            const updated = [
              ...prev.slice(-49),
              {
                date: hour,
                threats: newItem.threats ?? 0,
                blocked: Math.floor((newItem.threats ?? 0) * 0.7),
                ddos: newItem.ddos ?? 0,
                malware: newItem.malware ?? 0,
                suspicious: newItem.suspicious ?? 0,
              },
            ]
            return JSON.stringify(prev) === JSON.stringify(updated) ? prev : updated
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // ✅ useMemo로 안정적인 데이터 참조 유지 (불필요한 렌더 방지)
  const chartData = useMemo(() => trendData, [trendData])
  const pieData = useMemo(() => attackTypeData, [attackTypeData])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[400px] text-muted-foreground">
        ⏳ 위협 트렌드 로딩 중...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-[400px] text-red-500">
        ⚠️ {error}
      </div>
    )
  }

  return (
    <div className="space-y-6 transition-all">
      {/* 위협 탐지 동향 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>위협 탐지 동향</CardTitle>
            <CardDescription>시간별 위협 탐지 및 차단 현황</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid black",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="threats"
                  stackId="1"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.6}
                  name="총 위협"
                  isAnimationActive={true}
                />
                <Area
                  type="monotone"
                  dataKey="blocked"
                  stackId="2"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                  name="차단됨"
                  isAnimationActive={true}
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
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  isAnimationActive={true}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {pieData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
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

      {/* 공격 유형별 상세 동향 */}
      <Card>
        <CardHeader>
          <CardTitle>공격 유형별 상세 동향</CardTitle>
          <CardDescription>각 공격 유형의 시간별 변화 추이</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
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

// ✅ 메모이제이션으로 상위 rerender 시에도 차트 유지
export default React.memo(ThreatTrendsInner)
