"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Ban } from "lucide-react"

interface BlockedIP {
  ip: string
  country: string
  reason: string
  blockedAt: string
}

interface BlockedIPsProps {
  blockedIPs: BlockedIP[]
}

export default function BlockedIPs({ blockedIPs }: BlockedIPsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>차단된 IP 관리</CardTitle>
        <CardDescription>현재 차단된 IP 주소 목록과 관리</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              총 {blockedIPs.length}개의 IP가 차단되었습니다
            </div>
            <Button size="sm">IP 수동 차단</Button>
          </div>

          <div className="space-y-3">
            {blockedIPs.map((blocked, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Ban className="h-4 w-4 text-destructive" />
                    <span className="font-mono text-sm">{blocked.ip}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {blocked.country}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{blocked.reason}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">차단 시간: {blocked.blockedAt}</span>
                  <Button size="sm" variant="outline">
                    차단 해제
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
