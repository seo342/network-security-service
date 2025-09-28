"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Threat {
  id: number
  time: string
  ip: string
  country: string
  status: string
  type: string
}

interface ThreatTableProps {
  threats: Threat[]
}

export default function ThreatTable({ threats }: ThreatTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>위협 분석 대시보드</CardTitle>
        <CardDescription>탐지된 위협의 상세 분석 정보</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3">시간</th>
                <th className="text-left p-3">IP 주소</th>
                <th className="text-left p-3">국가</th>
                <th className="text-left p-3">상태</th>
                <th className="text-left p-3">작업</th>
              </tr>
            </thead>
            <tbody>
              {threats.map((threat) => (
                <tr key={threat.id} className="border-b border-border/50">
                  <td className="p-3 text-sm">{threat.time}</td>
                  <td className="p-3 font-mono text-sm">{threat.ip}</td>
                  <td className="p-3 text-sm">{threat.country}</td>
                  <td className="p-3">
                    <Badge
                      variant={
                        threat.type === "danger"
                          ? "destructive"
                          : threat.type === "warning"
                          ? "secondary"
                          : "default"
                      }
                      className="text-xs"
                    >
                      {threat.status}
                    </Badge>
                  </td>
                  <td className="p-3">
                    {threat.type === "danger" && (
                      <Button size="sm" variant="destructive">
                        차단
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
