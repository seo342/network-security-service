"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, AlertTriangle, Ban, Activity } from "lucide-react"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Stats {
  totalRequests: number
  threatsDetected: number
  blockedIPs: number
  uptime: string
}

/**
 * ✅ 실시간 통계 카드 컴포넌트
 * - Supabase DB에서 직접 데이터 로드
 * - 트리거 기반 자동 집계 데이터 반영
 */
export default function StatsCards() {
  const [stats, setStats] = useState<Stats>({
    totalRequests: 0,
    threatsDetected: 0,
    blockedIPs: 0,
    uptime: "99.9%",
  })

  // 🔹 데이터 로드 함수
  const fetchStats = async () => {
    try {
      // 오늘 날짜 00시 기준
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayISOString = today.toISOString()

      // 1️⃣ 오늘 총 요청 수
      const { data: requestsData } = await supabase
        .from("traffic_logs")
        .select("requests")
        .gte("time", todayISOString)

      const totalRequests =
        requestsData?.reduce((sum, row) => sum + (row.requests || 0), 0) || 0

      // 2️⃣ 최근 24시간 위협 탐지 수
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data: threatsData } = await supabase
        .from("traffic_logs")
        .select("threats")
        .gte("time", since)

      const threatsDetected =
        threatsData?.reduce((sum, row) => sum + (row.threats || 0), 0) || 0

      // 3️⃣ 차단된 IP 수
      const { data: blockedData } = await supabase
        .from("country_threats")
        .select("blocked")

      const blockedIPs =
        blockedData?.reduce((sum, row) => sum + (row.blocked || 0), 0) || 0

      // 4️⃣ 가동률 (avg_response_time 기준 간이 계산)
      const { data: metrics } = await supabase
        .from("metrics_summary")
        .select("avg_response_time")

      const avgResponse =
        metrics?.reduce(
          (sum, row) => sum + Number(row.avg_response_time || 0),
          0
        ) /
          (metrics?.length || 1) || 0

      const uptime =
        avgResponse < 30
          ? "99.9%"
          : avgResponse < 100
          ? "99.5%"
          : "97.0%"

      setStats({
        totalRequests,
        threatsDetected,
        blockedIPs,
        uptime,
      })
    } catch (err) {
      console.error("❌ 통계 로드 실패:", err)
    }
  }

  // ✅ 마운트 시 및 실시간 구독
  useEffect(() => {
    fetchStats()

    // 실시간 트래픽 변화 감지 → 자동 업데이트
    const channel = supabase
      .channel("stats-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "traffic_logs" },
        () => fetchStats()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // ✅ UI
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* 총 요청 수 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">총 요청 수</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.totalRequests.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">오늘 기준</p>
        </CardContent>
      </Card>

      {/* 위협 탐지 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">위협 탐지</CardTitle>
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {stats.threatsDetected}
          </div>
          <p className="text-xs text-muted-foreground">지난 24시간</p>
        </CardContent>
      </Card>

      {/* 차단된 IP */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">차단된 IP</CardTitle>
          <Ban className="h-4 w-4 text-accent" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-accent">
            {stats.blockedIPs}
          </div>
          <p className="text-xs text-muted-foreground">현재 활성</p>
        </CardContent>
      </Card>

      {/* 가동률 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">가동률</CardTitle>
          <Activity className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-500">
            {stats.uptime}
          </div>
          <p className="text-xs text-muted-foreground">이번 달</p>
        </CardContent>
      </Card>
    </div>
  )
}
