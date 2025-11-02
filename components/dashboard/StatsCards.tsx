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
  status: string // ✅ active | inactive
}

/**
 * ✅ 특정 API 키 기준 트래픽 통계 카드
 * - traffic_logs 테이블에서 통계 계산
 * - api_keys.status 값으로 활성/비활성 표시
 */
export default function StatsCards({ apiKeyId }: { apiKeyId: string }) {
  const [stats, setStats] = useState<Stats>({
    totalRequests: 0,
    threatsDetected: 0,
    blockedIPs: 0,
    status: "inactive",
  })

  // 🔹 통계 + 상태 불러오기
  const fetchStats = async () => {
    try {
      if (!apiKeyId) return

      // ✅ 1️⃣ traffic_logs 데이터 가져오기
      const { data: logs, error: logError } = await supabase
        .from("traffic_logs")
        .select("detection_result, category, flow_info, source_ip")
        .eq("api_key_id", apiKeyId)

      if (logError) throw logError

      const totalRequests = logs?.length ?? 0

      const threatsDetected =
        logs?.filter((log) => {
          const type = (log.detection_result || log.category || "").toLowerCase()
          return type && !["benign", "normal"].includes(type)
        }).length ?? 0

      const blockedIPs =
        new Set(
          logs
            ?.filter((log) => {
              const type = (log.detection_result || log.category || "").toLowerCase()
              return type && !["benign", "normal"].includes(type)
            })
            .map((log) => log.flow_info?.src_ip ?? log.source_ip)
        ).size ?? 0

      // ✅ 2️⃣ api_keys.status 불러오기
      const { data: keyData, error: keyError } = await supabase
        .from("api_keys")
        .select("status")
        .eq("id", apiKeyId)
        .single()

      if (keyError) throw keyError
      const status = keyData?.status || "inactive"

      setStats({ totalRequests, threatsDetected, blockedIPs, status })
    } catch (err) {
      console.error("❌ 통계 로드 실패:", err)
    }
  }

  // ✅ 실시간 반영 (traffic_logs 또는 api_keys 상태 변경 시)
  useEffect(() => {
    fetchStats()

    // 1️⃣ traffic_logs 실시간 반영
    const logsChannel = supabase
      .channel("realtime:traffic_logs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "traffic_logs" },
        (payload) => {
          if (payload.new.api_key_id === apiKeyId) fetchStats()
        }
      )
      .subscribe()

    // 2️⃣ api_keys.status 변경 감지
    const keysChannel = supabase
      .channel("realtime:api_keys")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "api_keys" },
        (payload) => {
          if (payload.new.id === Number(apiKeyId)) fetchStats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(logsChannel)
      supabase.removeChannel(keysChannel)
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

      {/* 활성 상태 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">상태</CardTitle>
          <Activity
            className={`h-4 w-4 ${
              stats.status === "active"
                ? "text-green-500 animate-pulse"
                : "text-gray-400"
            }`}
          />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              stats.status === "active" ? "text-green-500" : "text-gray-400"
            }`}
          >
            {stats.status === "active" ? "Active" : "Inactive"}
          </div>
          <p className="text-xs text-muted-foreground">
            API 키 현재 상태
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
