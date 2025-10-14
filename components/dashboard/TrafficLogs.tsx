"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { PacketFilterState } from "./PacketLogFilters"

interface TrafficLog {
  id: number
  time: string
  requests: number
  threats: number
  ddos: number
  malware: number
  suspicious: number
  protocol?: number
}

// ✅ 시간 포맷 함수
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  if (isNaN(date.getTime())) return "-"
  const pad = (n: number) => n.toString().padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `
       + `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

// ✅ 프로토콜 번호 → 이름 매핑
const protoName = (num?: number) => {
  switch (num) {
    case 6: return "TCP"
    case 17: return "UDP"
    case 1: return "ICMP"
    default: return "OTHER"
  }
}

interface TrafficLogsProps {
  filters: PacketFilterState
}

/**
 * ✅ 트래픽 로그 테이블 컴포넌트
 * - /dashboard/traffic API에서 데이터 불러옴
 * - PacketLogFilters에서 전달된 필터를 적용
 */
export default function TrafficLogs({ filters }: TrafficLogsProps) {
  const [logs, setLogs] = useState<TrafficLog[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const res = await fetch("/dashboard/traffic")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      let list: TrafficLog[] = (data.logs || []).map((log: any) => ({
        id: log.id,
        time: formatTime(log.time),
        requests: log.requests ?? 0,
        threats: log.threats ?? 0,
        ddos: log.ddos ?? 0,
        malware: log.malware ?? 0,
        suspicious: log.suspicious ?? 0,
        protocol: log.protocol ?? 0,
      }))

      // ✅ 시간 필터 적용
      const now = new Date()
      let threshold = new Date()
      switch (filters.timeRange) {
        case "30m": threshold = new Date(now.getTime() - 30 * 60 * 1000); break
        case "1h": threshold = new Date(now.getTime() - 60 * 60 * 1000); break
        case "24h": threshold = new Date(now.getTime() - 24 * 60 * 60 * 1000); break
        case "7d": threshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break
        case "30d": threshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break
      }
      list = list.filter((log) => new Date(log.time) >= threshold)

      // ✅ 프로토콜 필터 적용
      const activeProtos = Object.entries(filters.protocols)
        .filter(([_, v]) => v)
        .map(([k]) => k)
      list = list.filter((log) => activeProtos.includes(protoName(log.protocol)))

      setLogs(list)
      setError(null)
    } catch (err: any) {
      console.error("🚨 traffic_logs fetch 실패:", err.message)
      setError("서버에서 데이터를 불러올 수 없습니다.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
    const interval = setInterval(fetchLogs, 5000)
    return () => clearInterval(interval)
  }, [filters]) // ← 필터 바뀌면 즉시 다시 fetch

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>트래픽 통계 로그</CardTitle>
        <CardDescription>시간별 요청 및 위협 분석 현황</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="px-4 py-2 text-left text-xs font-medium">시간</th>
                <th className="px-4 py-2 text-center text-xs font-medium">프로토콜</th>
                <th className="px-4 py-2 text-center text-xs font-medium">요청 수</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-red-600">위협 수</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-yellow-600">DDoS</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-blue-600">Malware</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-orange-600">Suspicious</th>
              </tr>
            </thead>
            <tbody>
              {error ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-red-500">
                    ⚠️ {error}
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    ⏳ 로딩 중...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    데이터 없음
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2 font-mono">{log.time}</td>
                    <td className="px-4 py-2 text-center font-mono">{protoName(log.protocol)}</td>
                    <td className="px-4 py-2 text-center">{log.requests}</td>
                    <td className="px-4 py-2 text-center text-red-600 font-semibold">{log.threats}</td>
                    <td className="px-4 py-2 text-center text-yellow-600">{log.ddos}</td>
                    <td className="px-4 py-2 text-center text-blue-600">{log.malware}</td>
                    <td className="px-4 py-2 text-center text-orange-600">{log.suspicious}</td>
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
