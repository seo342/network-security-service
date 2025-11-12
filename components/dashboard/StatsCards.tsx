"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, AlertTriangle, Ban, Activity, Calendar } from "lucide-react"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Stats {
  totalRequests: number
  threatsDetected: number
  blockedIPs: number
  status: string // active | inactive
}

type RangeType = "today" | "7d" | "30d"

/**
 * ✅ API 키 기준 통계 카드 (기간 선택 가능)
 * - traffic_logs.time 기준으로 기간 필터링
 * - api_keys.status로 Active/Inactive 표시
 */
export default function StatsCards({ apiKeyId }: { apiKeyId: string }) {
  const [stats, setStats] = useState<Stats>({
    totalRequests: 0,
    threatsDetected: 0,
    blockedIPs: 0,
    status: "inactive",
  })
  const [range, setRange] = useState<RangeType>("today") // 🔹 기본값: 오늘

  const fetchStats = async () => {
    try {
      if (!apiKeyId) return

      // ✅ 기간 시작 계산
      const start = new Date()
      if (range === "today") start.setHours(0, 0, 0, 0)
      if (range === "7d") start.setDate(start.getDate() - 7)
      if (range === "30d") start.setDate(start.getDate() - 30)
      const startString = start.toISOString().replace("T", " ").replace("Z", "")

      // ✅ 1️⃣ traffic_logs 가져오기
      const { data: logs, error: logError } = await supabase
        .from("traffic_logs")
        .select("detection_result, category, flow_info, source_ip, time")
        .eq("api_key_id", Number(apiKeyId))
        .gte("time", startString)

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
        .eq("id", Number(apiKeyId))
        .maybeSingle()

      if (keyError) throw keyError
      const status = keyData?.status || "inactive"

      setStats({ totalRequests, threatsDetected, blockedIPs, status })
    } catch (err) {
      console.error("❌ 통계 로드 실패:", err)
    }
  }

  // ✅ 실시간 반영
  useEffect(() => {
    fetchStats()

    const logsChannel = supabase
      .channel("realtime:traffic_logs")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "traffic_logs" }, (payload) => {
        if (payload.new.api_key_id === apiKeyId) fetchStats()
      })
      .subscribe()

    const keysChannel = supabase
      .channel("realtime:api_keys")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "api_keys" }, (payload) => {
        if (payload.new.id === Number(apiKeyId)) fetchStats()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(logsChannel)
      supabase.removeChannel(keysChannel)
    }
  }, [apiKeyId, range]) // 🔹 range 바뀔 때마다 새로 fetch

  // ✅ UI 렌더링
  return (
    <div className="space-y-4 mb-8">
      {/* 기간 선택 */}
      <div className="flex justify-end">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={range} onValueChange={(val) => setRange(val as RangeType)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="기간 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">오늘</SelectItem>
              <SelectItem value="7d">최근 7일</SelectItem>
              <SelectItem value="30d">최근 30일</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 통계 카드 4개 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 요청 수 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {range === "today" ? "오늘 요청 수" : "요청 수"}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {range === "today"
                ? "오늘 발생한 API 요청"
                : range === "7d"
                ? "최근 7일간 요청 수"
                : "최근 30일간 요청 수"}
            </p>
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
            <p className="text-xs text-muted-foreground">
              {range === "today"
                ? "오늘 탐지된 공격 수"
                : range === "7d"
                ? "최근 7일간 탐지된 공격"
                : "최근 30일간 탐지된 공격"}
            </p>
          </CardContent>
        </Card>

        {/* 차단된 IP */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">위협 IP</CardTitle>
            <Ban className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {stats.blockedIPs.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {range === "today"
                ? "오늘 위협 발생 IP"
                : range === "7d"
                ? "최근 7일간 위협 IP"
                : "최근 30일간 위협 IP"}
            </p>
          </CardContent>
        </Card>

        {/* 상태 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">상태</CardTitle>
            <Activity
              className={`h-4 w-4 ${
                stats.status === "active" ? "text-green-500 animate-pulse" : "text-gray-400"
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
            <p className="text-xs text-muted-foreground">API 키 현재 상태</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
