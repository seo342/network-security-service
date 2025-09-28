"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function SystemStatus() {
  const systems = [
    { name: "AI 위협 탐지 엔진", status: "정상" },
    { name: "DDoS 방어 시스템", status: "정상" },
    { name: "IP 차단 시스템", status: "정상" },
    { name: "알림 시스템", status: "정상" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>시스템 상태</CardTitle>
        <CardDescription>보안 시스템 운영 현황</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {systems.map((sys, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">{sys.name}</span>
              </div>
              <Badge variant="secondary" className="text-green-500">
                {sys.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
