"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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

export default function TrafficLogsPage() {
  const [logs, setLogs] = useState<PacketLog[]>([])

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("/dashboard/traffic")
        if (!res.ok) return
        const data = await res.json()
        setLogs(data)
      } catch (e) {
        console.error("Failed to fetch logs:", e)
      }
    }

    fetchLogs()
    const interval = setInterval(fetchLogs, 5000) // 5초마다 갱신
    return () => clearInterval(interval)
  }, [])

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
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    아직 데이터 없음
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-2 text-sm font-mono">{log.timestamp}</td>
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
