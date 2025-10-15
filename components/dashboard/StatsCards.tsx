"use client"

import { useEffect, useState } from "react"
import { SupabaseClient } from "@supabase/supabase-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, AlertTriangle, Ban, Activity } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

interface Stats {
  totalRequests: number
  threatsDetected: number
  blockedIPs: number
  uptime: string
}

/**
 * ✅ 전체 트래픽 로그 기반 통계 카드
 * - 모든 기간의 로그를 기준으로 계산
 * - 실시간 반영 유지
 */
export default function StatsCards() {
  const [stats, setStats] = useState<Stats>({
    totalRequests: 0,
    threatsDetected: 0,
    blockedIPs: 0,
    uptime: "99.9%",
  })

  // ✅ 통계 계산
  const fetchStats = async () => {
    try {
      // ✅ traffic_logs 전체 불러오기
      const { data: logs, error } = await supabase
        .from("traffic_logs")
        .select("id, time, source_ip, detection_result, category")

      if (error) throw error
      console.log("📦 전체 로그 개수:", logs?.length || 0)

      // 총 요청 수
      const totalRequests = logs?.length || 0

      // 위협 탐지 = BENIGN, NORMAL 제외
      const threatsDetected =
        logs?.filter((log) => {
          const type = (log.detection_result || log.category || "").toLowerCase()
          return type && !["benign", "normal"].includes(type)
        }).length || 0

      // 차단된 IP = 위협 발생한 source_ip 고유 개수
      const blockedIPs = new Set(
        logs
          ?.filter((log) => {
            const type = (log.detection_result || log.category || "").toLowerCase()
            return type && !["benign", "normal"].includes(type)
          })
          .map((log) => log.source_ip)
      ).size

      // 가동률 = 정상 비율
      const benignCount =
        logs?.filter((log) => {
          const type = (log.detection_result || log.category || "").toLowerCase()
          return ["benign", "normal"].includes(type)
        }).length || 0

      const uptimeRatio = totalRequests > 0 ? benignCount / totalRequests : 1
      const uptime =
        uptimeRatio >= 0.99
          ? "99.9%"
          : uptimeRatio >= 0.95
          ? "99.5%"
          : uptimeRatio >= 0.9
          ? "98.0%"
          : "95.0%"

      setStats({ totalRequests, threatsDetected, blockedIPs, uptime })

      console.log("✅ 전체 데이터 기준 통계:", {
        totalRequests,
        threatsDetected,
        blockedIPs,
        uptime,
      })
    } catch (err) {
      console.error("❌ 통계 로드 실패:", err)
    }
  }

  // ✅ 마운트 시 및 실시간 반영
  useEffect(() => {
    fetchStats()

    const channel = supabase
      .channel("realtime:traffic_logs")
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
          <p className="text-xs text-muted-foreground">전체 기준</p>
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
            {stats.threatsDetected.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">전체 로그 기준</p>
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
            {stats.blockedIPs.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">위협 IP 기준</p>
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
          <p className="text-xs text-muted-foreground">전체 기준</p>
        </CardContent>
      </Card>
    </div>
  )
}
