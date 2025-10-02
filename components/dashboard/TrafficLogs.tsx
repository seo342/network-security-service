"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PacketFilterState } from "./PacketLogFilters"

interface PacketLog {
  timestamp: string
  src_ip: string
  dst_ip: string
  protocol: string
  tcp_flags?: string
  tcp_seq?: number
  payload?: string
  packet_size: number
}

interface TrafficLogsProps {
  filters: PacketFilterState
}

// ✅ 시간 포맷 함수
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const pad = (n: number) => n.toString().padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `
       + `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export default function TrafficLogs({ filters }: TrafficLogsProps) {
  const [logs, setLogs] = useState<PacketLog[]>([])

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        // ✅ 로컬스토리지나 환경에서 API 키 불러오기
        const apiKey = localStorage.getItem("api_key")
        if (!apiKey) {
          console.warn("API Key 없음 → 로그 요청 불가")
          return
        }

        const res = await fetch("/dashboard/traffic", {
          headers: {
            Authorization: `Bearer ${apiKey}`,   // ✅ 키 포함
          },
        })

        if (!res.ok) {
          console.error("로그 요청 실패:", res.status)
          return
        }

        const data = await res.json()
        // 서버에서 { logs: [...] } 로 보낸 경우
        setLogs(data.logs || data)
      } catch (e) {
        console.error("Failed to fetch logs:", e)
      }
    }

    fetchLogs()
    const interval = setInterval(fetchLogs, 5000)
    return () => clearInterval(interval)
  }, [])

  // 필터 적용
  const filteredLogs = logs.filter((log) => {
    const proto = ["TCP", "UDP", "ICMP"].includes(log.protocol.toUpperCase())
      ? log.protocol.toUpperCase()
      : "OTHER"
    return filters.protocols[proto as keyof typeof filters.protocols]
  })

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>실시간 패킷 로그</CardTitle>
        <CardDescription>에이전트에서 수집된 네트워크 패킷 데이터</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="px-4 py-2 text-left text-xs font-medium">시간</th>
                <th className="px-4 py-2 text-left text-xs font-medium">출발지</th>
                <th className="px-4 py-2 text-left text-xs font-medium">도착지</th>
                <th className="px-4 py-2 text-left text-xs font-medium">프로토콜</th>
                <th className="px-4 py-2 text-left text-xs font-medium">TCP 플래그</th>
                <th className="px-4 py-2 text-left text-xs font-medium">시퀀스</th>
                <th className="px-4 py-2 text-left text-xs font-medium">페이로드</th>
                <th className="px-4 py-2 text-left text-xs font-medium">크기(Bytes)</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    아직 데이터 없음
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-2 text-sm font-mono">{formatTime(log.timestamp)}</td>
                    <td className="px-4 py-2 text-sm font-mono">{log.src_ip}</td>
                    <td className="px-4 py-2 text-sm font-mono">{log.dst_ip}</td>
                    <td className="px-4 py-2 text-sm">{log.protocol}</td>
                    <td className="px-4 py-2 text-sm">{log.tcp_flags || "-"}</td>
                    <td className="px-4 py-2 text-sm">{log.tcp_seq || "-"}</td>
                    <td className="px-4 py-2 text-sm truncate max-w-xs">{log.payload || "-"}</td>
                    <td className="px-4 py-2 text-sm">{log.packet_size}</td>
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
