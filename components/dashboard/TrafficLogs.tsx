"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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

// ✅ 시간 포맷 함수
const formatTime = (timestamp: string) => {
  if (!timestamp) return "-"
  const date = new Date(timestamp)
  if (isNaN(date.getTime())) return "-"
  const pad = (n: number) => n.toString().padStart(2, "0")
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export default function TrafficLogs() {
  const [logs, setLogs] = useState<TrafficLog[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // ✅ 데이터 fetch
  const fetchLogs = async () => {
    try {
      const res = await fetch("/dashboard/traffic")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      const list: TrafficLog[] = (data.logs || []).map((log: any) => ({
        id: log.id ?? Math.random(),
        time: formatTime(log.time),
        src_ip: log.flow_info?.src_ip ?? "-",
        dst_ip: log.flow_info?.dst_ip ?? "-",
        destination_port: log.Destination_Port ?? log.destination_port ?? 0,
        flow_duration: log.flow_duration ?? null,
        packet_count: log.packet_count ?? null,
        byte_count: log.byte_count ?? null,
        detection_result: log.detection_result ?? log.category ?? "Unknown",
        confidence: log.confidence ?? null,
      }))

      setLogs(list)
      setError(null)
    } catch (err: any) {
      console.error("🚨 traffic_logs fetch 실패:", err.message)
      setError("서버에서 데이터를 불러올 수 없습니다.")
    } finally {
      setLoading(false)
    }
  }

  // ✅ 5초마다 갱신
  useEffect(() => {
    fetchLogs()
    const interval = setInterval(fetchLogs, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>트래픽 세부 로그</CardTitle>
        <CardDescription>패킷 단위 네트워크 탐지 상세 기록</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="px-3 py-2 text-left text-xs font-medium">시간</th>
                <th className="px-3 py-2 text-center text-xs font-medium">출발 IP</th>
                <th className="px-3 py-2 text-center text-xs font-medium">도착 IP</th>
                <th className="px-3 py-2 text-center text-xs font-medium">도착 포트</th>
                <th className="px-3 py-2 text-center text-xs font-medium">플로우 지속시간(s)</th>
                <th className="px-3 py-2 text-center text-xs font-medium">패킷 수</th>
                <th className="px-3 py-2 text-center text-xs font-medium">바이트 수</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-red-600">공격 상태</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-blue-600">공격 확률(%)</th>
              </tr>
            </thead>

            <tbody>
              {error ? (
                <tr>
                  <td colSpan={9} className="text-center py-6 text-red-500">{error}</td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-6 text-muted-foreground">⏳ 로딩 중...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-6 text-muted-foreground">데이터 없음</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2 font-mono">{log.time}</td>
                    <td className="px-3 py-2 text-center font-mono">{log.src_ip}</td>
                    <td className="px-3 py-2 text-center font-mono">{log.dst_ip}</td>
                    <td className="px-3 py-2 text-center">{log.destination_port}</td>

                    {/* ✅ null-safe number 출력 */}
                    <td className="px-3 py-2 text-center">
                      {log.flow_duration != null ? log.flow_duration.toFixed(2) : "-"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {log.packet_count != null ? log.packet_count : "-"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {log.byte_count != null ? log.byte_count.toLocaleString() : "-"}
                    </td>

                    {/* ✅ 공격 상태 색상 */}
                    <td
                      className={`px-3 py-2 text-center font-semibold ${
                        log.detection_result?.toUpperCase() === "BENIGN"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {log.detection_result || "-"}
                    </td>

                    {/* ✅ 확률 null-safe */}
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
  )
}
