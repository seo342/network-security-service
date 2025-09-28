"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin } from "lucide-react"

// 목업 데이터 (DashboardPage에서 props로 내려줄 수도 있음)
const mockThreatData = [
  { id: 1, ip: "192.168.56.11", country: "대한민국", status: "정상", time: "14:22:10", type: "normal" },
  { id: 2, ip: "8.8.8.8", country: "미국", status: "경고", time: "15:11:11", type: "warning" },
  { id: 3, ip: "14.44.444.44", country: "북한", status: "위험", time: "17:11:13", type: "danger" },
  { id: 4, ip: "14.44.444.44", country: "북한", status: "위험", time: "17:11:13", type: "danger" },
  { id: 5, ip: "14.44.444.44", country: "북한", status: "위험", time: "17:11:13", type: "danger" },
]

export default function RecentThreats() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>최근 위협 활동</CardTitle>
        <CardDescription>실시간 위협 탐지 로그</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockThreatData.slice(0, 5).map((threat) => (
            <div
              key={threat.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
            >
              {/* IP + 국가 */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm">{threat.ip}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {threat.country}
                </Badge>
              </div>

              {/* 상태 + 시간 */}
              <div className="flex items-center gap-2">
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
                <span className="text-xs text-muted-foreground">{threat.time}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
