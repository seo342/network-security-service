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
  top_features: {
    main_protocol: string | null
    top_dst_port: string | null
  }
}

const formatTime = (timestamp: string) => {
  if (!timestamp) return "-"
  const date = new Date(timestamp)
  if (isNaN(date.getTime())) return "-"
  const pad = (n: number) => n.toString().padStart(2, "0")
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export default function PacketLogDashboard({ apiKeyId }: { apiKeyId: string }) {
  const [filters, setFilters] = useState<PacketFilterState>({
    timeRange: "1h",
    protocols: { TCP: true, UDP: true, ICMP: true, OTHER: true },
  })

  const [logs, setLogs] = useState<TrafficLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [apiKeyName, setApiKeyName] = useState<string>("")

  // ✅ API 키 이름 조회
  useEffect(() => {
    const fetchApiKeyName = async () => {
      if (!apiKeyId) return
      const { data, error } = await supabase
        .from("api_keys")
        .select("name")
        .eq("id", apiKeyId)
        .maybeSingle()

      if (!error && data) setApiKeyName(data.name)
    }
    fetchApiKeyName()
  }, [apiKeyId])

  // ✅ 로그 조회
  const fetchLogs = async () => {
    try {
      if (!apiKeyId) return
      setLoading(true)

      // 시간 범위 계산
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
        .limit(100)

      if (error) throw error

      const list: TrafficLog[] = (data || []).map((log: any) => {
        const core =
          log.key_features_evidence?.core_metrics ||
          log.flow_info?.core_metrics ||
          {}

        // ✅ 주요 프로토콜 추출 (TCP, UDP, ICMP 중 ratio가 가장 큰 것)
        const proto =
          log.key_features_evidence?.protocol_signals ||
          log.flow_info?.protocol_signals ||
          {}
        const protocolRatios: Record<string, number> = {
          TCP: proto.tcp_ratio ?? 0,
          UDP: proto.udp_ratio ?? 0,
          ICMP: proto.icmp_ratio ?? 0,
        }
        const mainProtocol =
          Object.entries(protocolRatios).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-"

        // ✅ 주요 도착 포트 (가장 많이 등장한 포트)
        const portStats = log.flow_info?.top_ports || []
        const topDstPort = portStats.length > 0 ? portStats[0].port ?? "-" : "-"

        return {
          id: log.id ?? Math.random(),
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
          top_features: {
            main_protocol: mainProtocol,
            top_dst_port: topDstPort,
          },
        }
      })

      setLogs(list)
      setError(null)
    } catch (err: any) {
      console.error("🚨 로그 로드 실패:", err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [apiKeyId, filters])

  return (
    <div className="flex gap-6">
      <PacketLogFilters filters={filters} setFilters={setFilters} />

      <Card className="flex-1">
        <CardHeader>
          <CardTitle>트래픽 요약</CardTitle>
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
                  <th className="px-3 py-2 text-left text-xs font-medium">시간</th>
                  <th className="px-3 py-2 text-center text-xs font-medium">총 플로우 수</th>
                  <th className="px-3 py-2 text-center text-xs font-medium">총 패킷 수</th>
                  <th className="px-3 py-2 text-center text-xs font-medium">총 바이트 수</th>
                  <th className="px-3 py-2 text-center text-xs font-medium">초당 플로우 수</th>
                  <th className="px-3 py-2 text-center text-xs font-medium">주요 도착 포트</th>
                  <th className="px-3 py-2 text-center text-xs font-medium">도착 포트 수</th>
                  <th className="px-3 py-2 text-center text-xs font-medium">주요 프로토콜</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-red-600">탐지 결과</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-blue-600">확률(%)</th>
                </tr>
              </thead>
              <tbody>
                {error ? (
                  <tr>
                    <td colSpan={10} className="text-center py-6 text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : loading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-6 text-muted-foreground">
                      ⏳ 로딩 중...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-6 text-muted-foreground">
                      데이터 없음
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2 font-mono">{log.time}</td>
                      <td className="px-3 py-2 text-center">{log.core_metrics.flow_count ?? "-"}</td>
                      <td className="px-3 py-2 text-center">{log.core_metrics.packet_count_sum ?? "-"}</td>
                      <td className="px-3 py-2 text-center">
                        {log.core_metrics.byte_count_sum?.toLocaleString() ?? "-"}
                      </td>
                      <td className="px-3 py-2 text-center">{log.core_metrics.flow_start_rate ?? "-"}</td>
                      <td className="px-3 py-2 text-center">{log.top_features.top_dst_port ?? "-"}</td>
                      <td className="px-3 py-2 text-center">{log.core_metrics.dst_port_nunique ?? "-"}</td>
                      <td className="px-3 py-2 text-center">{log.top_features.main_protocol ?? "-"}</td>
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
