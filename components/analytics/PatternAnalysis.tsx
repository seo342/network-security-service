"use client"

import React, { useEffect, useMemo, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Clock, TrendingUp, Globe, AlertTriangle, Shield } from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"

// ✅ 카테고리 타입 분리
type CategoryCounts = {
  정상: number
  디도스: number
  정찰: number
  "슬로우 공격": number
}

interface HourlyData extends CategoryCounts {
  hour: string
}

interface PatternAnalysisProps {
  apiKeyId: string
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ✅ 라벨 → 카테고리 매핑
const LABEL_CATEGORY_MAP: Record<string, string> = {
  BENIGN: "정상",

  // 디도스
  ICMP_FLOOD: "디도스",
  OTHER_TCP_FLOOD: "디도스",
  SYN_FLOOD: "디도스",
  UDP_AMPLIFY: "디도스",
  UDP_FLOOD: "디도스",

  // 정찰
  Port_Scan: "정찰",

  // 슬로우 공격
  Slowloris_Attack: "슬로우 공격",
}

// ✅ 색상 매핑
const CATEGORY_COLORS: Record<string, string> = {
  정상: "#22c55e",
  디도스: "#ef4444",
  정찰: "#eab308",
  "슬로우 공격": "#f97316",
}

/**
 * 📈 PatternAnalysis (API 키 기반)
 * - incidents 테이블을 기반으로 시간대별 공격 카테고리 통계 계산
 * - ‘정상’, ‘디도스’, ‘정찰’, ‘슬로우 공격’ 4개 분류로 시각화
 */
export default function PatternAnalysis({ apiKeyId }: PatternAnalysisProps) {
  const [data, setData] = useState<HourlyData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /** ✅ 데이터 로드 */
  const fetchPatternData = async () => {
    try {
      if (!apiKeyId) {
        setError("API 키가 제공되지 않았습니다.")
        return
      }

      const { data: incidents, error } = await supabase
        .from("incidents")
        .select("time, detection_result")
        .eq("api_key_id", apiKeyId)
        .order("time", { ascending: true })
        .limit(500)

      if (error) throw error

      if (!incidents || incidents.length === 0) {
        setData([])
        setLoading(false)
        return
      }

      // ✅ 시간대별 카운트 맵
      const hourMap: Record<string, CategoryCounts> = {}

      for (const it of incidents) {
        const time = new Date(it.time)
        const hour = `${time.getHours().toString().padStart(2, "0")}:00`

        const rawLabel = it.detection_result || "BENIGN"
        const category =
          LABEL_CATEGORY_MAP[rawLabel as keyof typeof LABEL_CATEGORY_MAP] || "기타"

        if (!hourMap[hour]) {
          hourMap[hour] = { 정상: 0, 디도스: 0, 정찰: 0, "슬로우 공격": 0 }
        }

        if (category in hourMap[hour]) {
          hourMap[hour][category as keyof CategoryCounts]++
        }
      }

      const formatted: HourlyData[] = Object.entries(hourMap)
        .map(([hour, counts]) => ({ hour, ...counts }))
        .sort((a, b) => (a.hour > b.hour ? 1 : -1))

      setData(formatted)
      setError(null)
    } catch (err: any) {
      console.error("❌ PatternAnalysis fetch error:", err.message)
      setError("패턴 데이터를 불러오지 못했습니다.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatternData()
    const interval = setInterval(fetchPatternData, 10000)
    return () => clearInterval(interval)
  }, [apiKeyId])

  const chartData = useMemo(() => data, [data])

  // ---------- 렌더링 ----------
  if (loading)
    return (
      <div className="flex justify-center items-center h-[400px] text-muted-foreground">
        ⏳ 시간대별 패턴 분석 로딩 중...
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
      {/* ▣ 시간대별 위협 패턴 */}
      <Card>
        <CardHeader>
          <CardTitle>시간대별 위협 패턴</CardTitle>
          <CardDescription>24시간 동안의 공격 유형별 발생 현황</CardDescription>
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
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                }}
              />
              {["정상", "디도스", "정찰", "슬로우 공격"].map((key) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stackId="1"
                  stroke={CATEGORY_COLORS[key]}
                  fill={CATEGORY_COLORS[key]}
                  fillOpacity={0.4}
                  name={key}
                />
              ))}
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
                  가장 공격이 활발할 시간을 확인해 보세요.
                </p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-destructive" />
                  <span className="font-medium">증가 추세</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  특정 공격의 추세를 확인하여 해당 공격들에 대한 위협을 확인해 보세요.
                </p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4 text-accent" />
                  <span className="font-medium">네트워크 공격 특성</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  가장 많은 공격을 확인하여 주요 공격 보트를 보호하세요.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 예측 분석 */}
        <Card>
          <CardHeader>
            <CardTitle>판단 기준</CardTitle>
            <CardDescription>권장사항</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border border-green-500/20 bg-green-500/10 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-green-500">정상</span>
                </div>
                <p className="text-sm">
                  해당 부분은 정상 트래픽입니다.
                </p>
              </div>
              <div className="p-4 border border-red-500/20 bg-red-500/10 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-red-500" />
                  <span className="font-medium text-red-500">디도스</span>
                </div>
                <p className="text-sm">
                  각종 DDos 공격을 감지하여 추가 모니터링 및 보안 강화를 권장합니다.
                </p>
              </div>
              <div className="p-4 border border-yellow-500/20 bg-yellow-500/10 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium text-yellow-500">정찰</span>
                </div>
                <p className="text-sm">
                  포트 스캔이 감지되어 DDos 공격이 예상 됩니다. 주의가 필요합니다.
                </p>
              </div>
              <div className="p-4 border border-orange-500/20 bg-orange-500/10 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500"/>
                  <span className="font-medium text-orange-500">슬로우 공격</span>
                </div>
                <p className="text-sm">
                  정상 트래픽과 큰 차이가 없는 공격으로 모니터링 확인이 필요합니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
