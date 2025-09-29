"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Filter, Download } from "lucide-react"

interface Incident {
  id: number
  time: string
  type: string
  source: string
  country: string
  severity: string
  status: string
  details: string
}

interface IncidentListProps {
  incidents: Incident[]
  getSeverityColor: (severity: string) => "destructive" | "secondary" | "default"
}

export default function IncidentList({ incidents, getSeverityColor }: IncidentListProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>최근 보안 사고</CardTitle>
            <CardDescription>실시간 보안 사고 및 대응 현황</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              필터
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              내보내기
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {incidents.map((incident) => (
            <div
              key={incident.id}
              className="p-4 border border-border/50 rounded-lg hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Badge variant={getSeverityColor(incident.severity)}>{incident.severity}</Badge>
                  <span className="font-medium">{incident.type}</span>
                  <Badge variant="outline">{incident.status}</Badge>
                </div>
                <span className="text-sm text-muted-foreground">{incident.time}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">출발지 IP:</span>
                  <div className="font-mono">{incident.source}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">국가:</span>
                  <div>{incident.country}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">상태:</span>
                  <div>{incident.status}</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border/50">
                <span className="text-muted-foreground text-sm">상세 정보:</span>
                <p className="text-sm mt-1">{incident.details}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
