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
  src_ip: string
  dst_ip: string
  destination_port: number
  flow_duration: number | null
  packet_count: number | null
  byte_count: number | null
  detection_result: string
  confidence: number | null
}

const formatTime = (timestamp: string) => {
  if (!timestamp) return "-"
  const date = new Date(timestamp)
  if (isNaN(date.getTime())) return "-"
  const pad = (n: number) => n.toString().padStart(2, "0")
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

/**
 * ✅ PacketLogDashboard
 * - 상위 컴포넌트: 필터 + 로그 통합
 * - apiKeyId를 기준으로 Supabase 쿼리 수행
 */
export default function PacketLogDashboard({ apiKeyId }: { apiKeyId: string }) {
  const [filters, setFilters] = useState<PacketFilterState>({
    timeRange: "1h",
    protocols: { TCP: true, UDP: true, ICMP: true, OTHER: true },
  })

  const [logs, setLogs] = useState<TrafficLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = async () => {
    try {
      if (!apiKeyId) return
      setLoading(true)

      // ✅ 시간 필터 계산
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

      // ✅ 프로토콜 필터
      const selectedProtocols = Object.keys(filters.protocols).filter(
        (proto) => filters.protocols[proto as keyof typeof filters.protocols]
      )

      // ✅ Supabase 쿼리
      let query = supabase
        .from("traffic_logs")
        .select("*")
        .eq("api_key_id", apiKeyId)
        .gte("time", startTime.toISOString())
        .order("time", { ascending: false })
        .limit(100)

      // 프로토콜 조건 추가
      if (selectedProtocols.length && selectedProtocols.length < 4) {
        query = query.in("protocol", selectedProtocols.map((p) => {
          if (p === "TCP") return 6
          if (p === "UDP") return 17
          if (p === "ICMP") return 1
          return null
        }).filter((v) => v !== null))
      }

      const { data, error } = await query
      if (error) throw error

      const list: TrafficLog[] = (data || []).map((log: any) => ({
        id: log.id ?? Math.random(),
        time: formatTime(log.time),
        src_ip: log.source_ip ?? log.flow_info?.src_ip ?? "-",
        dst_ip: log.destination_ip ?? log.flow_info?.dst_ip ?? "-",
        destination_port: log.destination_port ?? 0,
        flow_duration: log.flow_duration ?? null,
        packet_count: log.packet_count ?? null,
        byte_count: log.byte_count ?? null,
        detection_result: log.detection_result ?? log.category ?? "Unknown",
        confidence: log.confidence ?? null,
      }))

      setLogs(list)
      setError(null)
    } catch (err: any) {
      console.error("🚨 로그 로드 실패:", err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ✅ 필터 변경 시 자동 업데이트
  useEffect(() => {
    fetchLogs()
  }, [apiKeyId, filters])

  return (
    <div className="flex gap-6">
      {/* 왼쪽: 필터 */}
      <PacketLogFilters filters={filters} setFilters={setFilters} />

      {/* 오른쪽: 로그 테이블 */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>트래픽 로그</CardTitle>
          <CardDescription>
            {apiKeyId ? `API 키 ID: ${apiKeyId}` : "API 키가 선택되지 않았습니다."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th className="px-3 py-2 text-left text-xs font-medium">시간</th>
                  <th className="px-3 py-2 text-center text-xs font-medium">출발 IP</th>
                  <th className="px-3 py-2 text-center text-xs font-medium">도착 IP</th>
                  <th className="px-3 py-2 text-center text-xs font-medium">포트</th>
                  <th className="px-3 py-2 text-center text-xs font-medium">패킷 수</th>
                  <th className="px-3 py-2 text-center text-xs font-medium">바이트 수</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-red-600">
                    탐지 결과
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-blue-600">
                    확률(%)
                  </th>
                </tr>
              </thead>
              <tbody>
                {error ? (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-red-500">{error}</td>
                  </tr>
                ) : loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-muted-foreground">⏳ 로딩 중...</td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-muted-foreground">데이터 없음</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2 font-mono">{log.time}</td>
                      <td className="px-3 py-2 text-center font-mono">{log.src_ip}</td>
                      <td className="px-3 py-2 text-center font-mono">{log.dst_ip}</td>
                      <td className="px-3 py-2 text-center">{log.destination_port}</td>
                      <td className="px-3 py-2 text-center">{log.packet_count ?? "-"}</td>
                      <td className="px-3 py-2 text-center">{log.byte_count?.toLocaleString() ?? "-"}</td>
                      <td className={`px-3 py-2 text-center font-semibold ${
                        log.detection_result?.toUpperCase() === "BENIGN"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}>
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
