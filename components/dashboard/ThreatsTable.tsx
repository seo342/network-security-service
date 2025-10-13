"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Threat {
  id: number
  time: string
  ip: string
  type: string
  status: string
  severity: string
}

export default function ThreatTable() {
  const [threats, setThreats] = useState<Threat[]>([])
  const [error, setError] = useState<string | null>(null)

  // ✅ PostgreSQL timestamp → YYYY-MM-DD HH:mm:ss 변환
  const formatTime = (timestamp: string) => {
    if (!timestamp) return "-"
    const iso = timestamp.replace(" ", "T")
    const date = new Date(iso)
    if (isNaN(date.getTime())) return "-"
    const pad = (n: number) => n.toString().padStart(2, "0")
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `
         + `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  }

  // ✅ Supabase incidents 데이터 fetch
  const fetchThreats = async () => {
    try {
      const res = await fetch("/dashboard/incidents")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const data = json.incidents || json

      const mapped = data.map((item: any) => ({
        id: item.id,
        time: formatTime(item.time),
        ip: item.source_ip,
        type: item.type,
        status: item.status,
        severity: item.severity,
      }))

      setThreats(mapped)
      setError(null)
    } catch (err: any) {
      console.error("🚨 incidents fetch 실패:", err.message)
      setError("서버에서 데이터를 불러올 수 없습니다.")
    }
  }

  useEffect(() => {
    fetchThreats()
    const interval = setInterval(fetchThreats, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>위협 분석 대시보드</CardTitle>
        <CardDescription>실시간 탐지된 위협 정보</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-xs font-medium">시간</th>
                <th className="text-left p-3 text-xs font-medium">IP 주소</th>
                <th className="text-left p-3 text-xs font-medium">공격 유형</th>
                <th className="text-left p-3 text-xs font-medium">심각도</th>
                <th className="text-left p-3 text-xs font-medium">상태</th>
                <th className="text-left p-3 text-xs font-medium">작업</th>
              </tr>
            </thead>
            <tbody>
              {error ? (
                <tr>
                  <td colSpan={6} className="text-center text-red-500 py-6">
                    ⚠️ {error}
                  </td>
                </tr>
              ) : threats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted-foreground py-6">
                    데이터 없음
                  </td>
                </tr>
              ) : (
                threats.map((threat) => (
                  <tr key={threat.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-3 text-sm">{threat.time}</td>
                    <td className="p-3 font-mono text-sm">{threat.ip}</td>
                    <td className="p-3 text-sm">{threat.type}</td>
                    <td className="p-3 text-sm">
                      <Badge
                        variant={
                          threat.severity === "높음"
                            ? "destructive"
                            : threat.severity === "중간"
                            ? "secondary"
                            : "default"
                        }
                        className="text-xs"
                      >
                        {threat.severity}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm">{threat.status}</td>
                    <td className="p-3">
                      {threat.severity === "높음" && (
                        <Button size="sm" variant="destructive">
                          차단
                        </Button>
                      )}
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
