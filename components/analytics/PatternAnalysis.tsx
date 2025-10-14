"use client"

import React, { useEffect, useState, useMemo } from "react"
import { createClient } from "@supabase/supabase-js"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Clock,
  TrendingUp,
  Globe,
  AlertTriangle,
  Shield,
} from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface HourlyData {
  hour: string
  threats: number
  normal: number
}

function PatternAnalysisInner() {
  const [data, setData] = useState<HourlyData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ✅ 데이터 가져오기
  const fetchPatternData = async () => {
    try {
      const { data: result, error } = await supabase
        .from("hourly_patterns")
        .select("hour, threats, normal")
        .order("hour", { ascending: true })

      if (error) throw error

      const formatted = (result || []).map((item) => ({
        hour: `${item.hour}시`,
        threats: item.threats ?? 0,
        normal: item.normal ?? 0,
      }))

      // ✅ 이전 데이터와 비교 → 바뀐 경우에만 setData
      setData((prev) =>
        JSON.stringify(prev) === JSON.stringify(formatted) ? prev : formatted
      )

      setError(null)
    } catch (err: any) {
      console.error("❌ hourly_patterns fetch error:", err.message)
      setError("패턴 데이터를 불러오지 못했습니다.")
    } finally {
      setLoading(false)
    }
  }

  // ✅ 초기 로드 + 주기적 갱신
  useEffect(() => {
    fetchPatternData()
    const interval = setInterval(fetchPatternData, 8000)
    return () => clearInterval(interval)
  }, [])

  // ✅ Supabase 실시간 감시
  useEffect(() => {
    const channel = supabase
      .channel("realtime:hourly_patterns")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "hourly_patterns" },
        (payload) => {
          const newItem = payload.new
          setData((prev) => {
            const updated = [...prev]
            const hourLabel = `${newItem.hour}시`
            const index = updated.findIndex((d) => d.hour === hourLabel)

            if (index !== -1) {
              updated[index] = {
                hour: hourLabel,
                threats: newItem.threats ?? 0,
                normal: newItem.normal ?? 0,
              }
            } else {
              updated.push({
                hour: hourLabel,
                threats: newItem.threats ?? 0,
                normal: newItem.normal ?? 0,
              })
            }

            return JSON.stringify(prev) === JSON.stringify(updated)
              ? prev
              : updated
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // ✅ useMemo로 안정적인 참조 유지
  const chartData = useMemo(() => data, [data])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[400px] text-muted-foreground">
        ⏳ 시간대별 패턴 분석 로딩 중...
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
      {/* ▣ 시간대별 위협 패턴 */}
      <Card>
        <CardHeader>
          <CardTitle>시간대별 위협 패턴</CardTitle>
          <CardDescription>24시간 동안의 위협 발생 패턴 분석</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" />
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
                dataKey="normal"
                stackId="1"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
                name="정상 트래픽"
                isAnimationActive={true}
              />
              <Area
                type="monotone"
                dataKey="threats"
                stackId="2"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.6}
                name="위협 트래픽"
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ▣ AI 분석 인사이트 & 권장사항 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 주요 인사이트 */}
        <Card>
          <CardHeader>
            <CardTitle>주요 패턴 인사이트</CardTitle>
            <CardDescription>AI가 분석한 위협 패턴 특징</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="font-medium">피크 시간대</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  오전 9–11시와 오후 2–4시에 위협 활동이 가장 활발합니다.
                </p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-destructive" />
                  <span className="font-medium">증가 추세</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  DDoS 공격이 지난 주 대비 약 15% 증가했습니다.
                </p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4 text-accent" />
                  <span className="font-medium">지역적 특성</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  북한 IP에서 발생하는 공격의 85%가 DDoS 유형입니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 예측 분석 */}
        <Card>
          <CardHeader>
            <CardTitle>예측 분석</CardTitle>
            <CardDescription>AI 기반 위협 예측 및 권장사항</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border border-yellow-500/20 bg-yellow-500/10 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium text-yellow-500">주의 필요</span>
                </div>
                <p className="text-sm">내일 오후 시간대에 DDoS 공격 증가가 예상됩니다.</p>
              </div>
              <div className="p-4 border border-blue-500/20 bg-blue-500/10 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-blue-500">권장사항</span>
                </div>
                <p className="text-sm">중국 IP 대역에 대한 추가 모니터링을 권장합니다.</p>
              </div>
              <div className="p-4 border border-green-500/20 bg-green-500/10 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-green-500">개선 사항</span>
                </div>
                <p className="text-sm">차단 성공률이 지속적으로 향상되고 있습니다.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default React.memo(PatternAnalysisInner)
