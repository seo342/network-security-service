"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import PacketLogFilters, { PacketFilterState } from "./PacketLogFilters"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface TrafficLog {
  id: number
  time: string
  detection_result: string
  confidence: number | null
  core_metrics: {
    flow_count: number | null
    packet_count_sum: number | null
    byte_count_sum: number | null
    flow_start_rate: number | null
    dst_port_nunique: number | null
  }
  main_protocol: string
  top_dst_port: string | null
}

// ✅ 시간 포맷
const formatTime = (timestamp: string) => {
  if (!timestamp) return "-"
  const d = new Date(timestamp)
  const pad = (n: number) => n.toString().padStart(2, "0")
  const datestr=`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  return `${datestr} ${timeStr}`
}

// ✅ JSON 내부에서 주요 프로토콜 계산
function getMainProtocol(log: any): string {
  try {
    const parsed =
      typeof log.key_features_evidence === "string"
        ? JSON.parse(log.key_features_evidence)
        : log.key_features_evidence || {}

    const proto = parsed.protocol_signals || {}
    const ratios = {
      TCP: proto.tcp_ratio ?? 0,
      UDP: proto.udp_ratio ?? 0,
      ICMP: proto.icmp_ratio ?? 0,
    }

    const [topKey, topVal] =
      Object.entries(ratios).sort((a, b) => b[1] - a[1])[0] ?? ["OTHER", 0]

    return topVal > 0 ? topKey : "OTHER"
  } catch {
    return "OTHER"
  }
}

export default function PacketLogDashboard({ apiKeyId }: { apiKeyId: string }) {
  const [filters, setFilters] = useState<PacketFilterState>({
    timeRange: "1h",
    protocols: { TCP: true, UDP: true, ICMP: true},
  })
  const [logs, setLogs] = useState<TrafficLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [apiKeyName, setApiKeyName] = useState<string>("")

  // ✅ API 키 이름 조회
  useEffect(() => {
    const fetchApiKeyName = async () => {
      if (!apiKeyId) return
      const { data } = await supabase
        .from("api_keys")
        .select("name")
        .eq("id", apiKeyId)
        .maybeSingle()
      if (data) setApiKeyName(data.name)
    }
    fetchApiKeyName()
  }, [apiKeyId])

  // ✅ 로그 초기 로드
  const fetchLogs = async () => {
    try {
      if (!apiKeyId) return
      setLoading(true)

      const now = new Date()
      let startTime = new Date()
      switch (filters.timeRange) {
        case "30m":
          startTime.setMinutes(now.getMinutes() - 30)
          break
        case "1h":
          startTime.setHours(now.getHours() - 1)
          break
        case "24h":
          startTime.setDate(now.getDate() - 1)
          break
        case "7d":
          startTime.setDate(now.getDate() - 7)
          break
        case "30d":
          startTime.setDate(now.getDate() - 30)
          break
      }

      const { data, error } = await supabase
        .from("traffic_logs")
        .select("*")
        .eq("api_key_id", apiKeyId)
        .gte("time", startTime.toISOString())
        .order("time", { ascending: false })
        .limit(200)

      if (error) throw error

      const parsedLogs = (data || []).map((log: any) => {
        const parsed =
          typeof log.key_features_evidence === "string"
            ? JSON.parse(log.key_features_evidence)
            : log.key_features_evidence || {}

        const core = parsed.core_metrics || {}
        const mainProtocol = getMainProtocol(log)
        const topDstPort = parsed.source_analysis?.top_dst_port_1?.toString() ?? "-"

        return {
          id: log.id,
          time: formatTime(log.time),
          detection_result: log.detection_result ?? log.category ?? "Unknown",
          confidence: log.confidence ?? null,
          core_metrics: {
            flow_count: core.flow_count ?? null,
            packet_count_sum: core.packet_count_sum ?? null,
            byte_count_sum: core.byte_count_sum ?? null,
            flow_start_rate: core.flow_start_rate ?? null,
            dst_port_nunique: core.dst_port_nunique ?? null,
          },
          main_protocol: mainProtocol,
          top_dst_port: topDstPort,
        }
      })

      // ✅ 프로토콜 필터 적용
      const activeProtocols = Object.entries(filters.protocols)
        .filter(([_, enabled]) => enabled)
        .map(([proto]) => proto)

      setLogs(parsedLogs.filter((l) => activeProtocols.includes(l.main_protocol)))
      setError(null)
    } catch (err: any) {
      console.error("🚨 로그 로드 실패:", err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ✅ 실시간 구독
  useEffect(() => {
    fetchLogs() // 초기 데이터 로드

    const channel = supabase
      .channel("realtime-traffic-logs")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "traffic_logs",
          filter: `api_key_id=eq.${apiKeyId}`,
        },
        (payload) => {
          const log = payload.new
          console.log("📡 실시간 로그 감지:", log)

          const parsed =
            typeof log.key_features_evidence === "string"
              ? JSON.parse(log.key_features_evidence)
              : log.key_features_evidence || {}

          const core = parsed.core_metrics || {}
          const mainProtocol = getMainProtocol(log)
          const topDstPort = parsed.source_analysis?.top_dst_port_1?.toString() ?? "-"

          const newLog: TrafficLog = {
            id: log.id,
            time: formatTime(log.time),
            detection_result: log.detection_result ?? log.category ?? "Unknown",
            confidence: log.confidence ?? null,
            core_metrics: {
              flow_count: core.flow_count ?? null,
              packet_count_sum: core.packet_count_sum ?? null,
              byte_count_sum: core.byte_count_sum ?? null,
              flow_start_rate: core.flow_start_rate ?? null,
              dst_port_nunique: core.dst_port_nunique ?? null,
            },
            main_protocol: mainProtocol,
            top_dst_port: topDstPort,
          }

          // ✅ 필터와 일치하는 프로토콜만 추가
          const activeProtocols = Object.entries(filters.protocols)
            .filter(([_, enabled]) => enabled)
            .map(([proto]) => proto)

          if (activeProtocols.includes(newLog.main_protocol)) {
            setLogs((prev) => [newLog, ...prev].slice(0, 200)) // 최신 로그 위로
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [apiKeyId, filters])

  return (
    <div className="flex gap-6">
      <PacketLogFilters filters={filters} setFilters={setFilters} />

      <Card className="flex-1">
        <CardHeader>
          <CardTitle>트래픽 요약 (실시간)</CardTitle>
          <CardDescription>
            {apiKeyName
              ? `API 키 이름: ${apiKeyName}`
              : apiKeyId
              ? `API 키 ID: ${apiKeyId}`
              : "API 키가 선택되지 않았습니다."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th className="px-3 py-2 text-left text-xs font-medium">날짜</th>
                  <th className="px-3 py-2 text-center text-xs font-medium">프로토콜</th>
                  <th className="px-3 py-2 text-center text-xs font-medium">총 플로우 수</th>
                  <th className="px-3 py-2 text-center text-xs font-medium">총 패킷 수</th>
                  <th className="px-3 py-2 text-center text-xs font-medium">총 바이트 수</th>
                  <th className="px-3 py-2 text-center text-xs font-medium">초당 플로우 수</th>
                  <th className="px-3 py-2 text-center text-xs font-medium">도착 포트</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-red-600">탐지 결과</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-blue-600">신뢰도(%)</th>
                </tr>
              </thead>
              <tbody>
                {error ? (
                  <tr>
                    <td colSpan={9} className="text-center py-6 text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-6 text-muted-foreground">
                      ⏳ 로딩 중...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-6 text-muted-foreground">
                      데이터 없음
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2 font-mono">{log.time}</td>
                      <td className="px-3 py-2 text-center">{log.main_protocol}</td>
                      <td className="px-3 py-2 text-center">{log.core_metrics.flow_count ?? "-"}</td>
                      <td className="px-3 py-2 text-center">{log.core_metrics.packet_count_sum ?? "-"}</td>
                      <td className="px-3 py-2 text-center">
                        {log.core_metrics.byte_count_sum?.toLocaleString() ?? "-"}
                      </td>
                      <td className="px-3 py-2 text-center">{log.core_metrics.flow_start_rate ?? "-"}</td>
                      <td className="px-3 py-2 text-center">{log.top_dst_port ?? "-"}</td>
                      <td
                        className={`px-3 py-2 text-center font-semibold ${
                          log.detection_result?.toUpperCase() === "BENIGN"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {log.detection_result || "-"}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {log.confidence != null ? (log.confidence * 100).toFixed(2) + "%" : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
