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
 * ✅ 특정 API 키 기준 트래픽 통계 카드
 * - traffic_logs 테이블에서 api_key_id로 필터링
 * - 실시간 반영 (INSERT 이벤트)
 */
export default function StatsCards({ apiKeyId }: { apiKeyId: string }) {
  const [stats, setStats] = useState<Stats>({
    totalRequests: 0,
    threatsDetected: 0,
    blockedIPs: 0,
    uptime: "99.9%",
  })

  const fetchStats = async () => {
    try {
      if (!apiKeyId) return

      const { data, error } = await supabase
        .from("traffic_logs")
        .select("detection_result, category, flow_info, source_ip")
        .eq("api_key_id", apiKeyId)

      if (error) throw error
      const logs = data || []

      // ✅ 총 요청 수
      const totalRequests = logs.length

      // ✅ 위협 탐지 수
      const threatsDetected = logs.filter((log) => {
        const type = (log.detection_result || log.category || "").toLowerCase()
        return type && !["benign", "normal"].includes(type)
      }).length

      // ✅ 차단된 IP (고유 src_ip 기준)
      const blockedIPs = new Set(
        logs
          .filter((log) => {
            const type = (log.detection_result || log.category || "").toLowerCase()
            return type && !["benign", "normal"].includes(type)
          })
          .map((log) => log.flow_info?.src_ip ?? log.source_ip)
      ).size

      // ✅ 가동률 계산
      const benignCount = logs.filter((log) => {
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

  // ✅ 실시간 반영 (INSERT 시)
  useEffect(() => {
    fetchStats()

    const channel = supabase
      .channel("realtime:traffic_logs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "traffic_logs" },
        (payload) => {
          if (payload.new.api_key_id === apiKeyId) fetchStats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [apiKeyId])

  // ✅ UI 렌더링
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* 총 요청 수 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">총 요청 수</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalRequests.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">API 키별 총 트래픽</p>
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
          <p className="text-xs text-muted-foreground">탐지된 공격 수</p>
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
          <p className="text-xs text-muted-foreground">위협 발생 IP 수</p>
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
          <p className="text-xs text-muted-foreground">정상 트래픽 비율</p>
        </CardContent>
      </Card>
    </div>
  )
}
