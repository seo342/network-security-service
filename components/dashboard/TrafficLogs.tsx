"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface TrafficLog {
  id: number
  time: string
  requests: number
  threats: number
  ddos: number
  malware: number
  suspicious: number
}

// ✅ 시간 포맷 함수
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const pad = (n: number) => n.toString().padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `
       + `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export default function TrafficLogs() {
  const [logs, setLogs] = useState<TrafficLog[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = async () => {
    try {
      const res = await fetch("/dashboard/traffic")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setLogs(data.logs || [])
      setError(null)
    } catch (err: any) {
      console.error("🚨 traffic_logs fetch 실패:", err.message)
      setError("서버에서 데이터를 불러올 수 없습니다.")
    }
  }

  useEffect(() => {
    fetchLogs()
    const interval = setInterval(fetchLogs, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>트래픽 통계 로그</CardTitle>
        <CardDescription>일자별 요청/위협 통계</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="px-4 py-2 text-left text-xs font-medium">시간</th>
                <th className="px-4 py-2 text-left text-xs font-medium">요청 수</th>
                <th className="px-4 py-2 text-left text-xs font-medium">위협 수</th>
                <th className="px-4 py-2 text-left text-xs font-medium">DDoS</th>
                <th className="px-4 py-2 text-left text-xs font-medium">Malware</th>
                <th className="px-4 py-2 text-left text-xs font-medium">Suspicious</th>
              </tr>
            </thead>
            <tbody>
              {error ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-red-500">
                    ⚠️ {error}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    데이터 없음
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-2 text-sm font-mono">{formatTime(log.time)}</td>
                    <td className="px-4 py-2 text-sm text-center">{log.requests}</td>
                    <td className="px-4 py-2 text-sm text-center text-red-500">{log.threats}</td>
                    <td className="px-4 py-2 text-sm text-center text-yellow-600">{log.ddos}</td>
                    <td className="px-4 py-2 text-sm text-center text-blue-600">{log.malware}</td>
                    <td className="px-4 py-2 text-sm text-center text-orange-600">{log.suspicious}</td>
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
