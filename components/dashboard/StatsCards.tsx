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
 * ✅ 사용자별 트래픽 통계 카드
 * - 자신의 API 키와 연관된 traffic_logs 기준
 * - 실시간 반영 (INSERT 시 자동 갱신)
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
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("로그인이 필요합니다.")

      // ✅ 유저 토큰 기반 API 요청
      const res = await fetch("/dashboard/traffic", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const logs = json.logs || []

      // ✅ 총 요청 수
      const totalRequests = logs.length

      // ✅ 위협 탐지: BENIGN, NORMAL 제외
      const threatsDetected = logs.filter((log: any) => {
        const type = (log.detection_result || log.category || "").toLowerCase()
        return type && !["benign", "normal"].includes(type)
      }).length

      // ✅ 차단된 IP: 위협 발생 source_ip 고유 개수
      const blockedIPs = new Set(
        logs
          .filter((log: any) => {
            const type = (log.detection_result || log.category || "").toLowerCase()
            return type && !["benign", "normal"].includes(type)
          })
          .map((log: any) => log.flow_info?.src_ip ?? log.source_ip)
      ).size

      // ✅ 가동률 (정상 비율)
      const benignCount = logs.filter((log: any) => {
        const type = (log.detection_result || log.category || "").toLowerCase()
        return ["benign", "normal"].includes(type)
      }).length

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
    } catch (err) {
      console.error("❌ 통계 로드 실패:", err)
    }
  }

  // ✅ 마운트 및 실시간 반영
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
          <p className="text-xs text-muted-foreground">내 API 키 기준</p>
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
          <p className="text-xs text-muted-foreground">내 로그 기준</p>
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
          <div className="text-2xl font-bold text-green-500">{stats.uptime}</div>
          <p className="text-xs text-muted-foreground">내 API 기준</p>
        </CardContent>
      </Card>
    </div>
  )
}
