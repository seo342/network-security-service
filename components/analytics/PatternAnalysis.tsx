"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, TrendingUp, Globe, AlertTriangle, Shield } from "lucide-react"
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts"

interface HourlyData {
  hour: string
  threats: number
  normal: number
}

interface PatternAnalysisProps {
  data: HourlyData[]
}

export default function PatternAnalysis({ data }: PatternAnalysisProps) {
  return (
    <div className="space-y-6">
      {/* 시간대별 위협 패턴 */}
      <Card>
        <CardHeader>
          <CardTitle>시간대별 위협 패턴</CardTitle>
          <CardDescription>24시간 동안의 위협 발생 패턴 분석</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Area
                type="monotone"
                dataKey="normal"
                stackId="1"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
                name="정상 트래픽"
              />
              <Area
                type="monotone"
                dataKey="threats"
                stackId="2"
                stroke="hsl(var(--destructive))"
                fill="hsl(var(--destructive))"
                fillOpacity={0.6}
                name="위협 트래픽"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* AI 분석 인사이트 & 권장사항 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>주요 패턴 인사이트</CardTitle>
            <CardDescription>AI가 분석한 위협 패턴 특징</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="font-medium">피크 시간대</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  오전 9-11시와 오후 2-4시에 위협 활동이 가장 활발합니다.
                </p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-destructive" />
                  <span className="font-medium">증가 추세</span>
                </div>
                <p className="text-sm text-muted-foreground">DDoS 공격이 지난 주 대비 15% 증가했습니다.</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4 text-accent" />
                  <span className="font-medium">지역적 특성</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  북한 IP에서 발생하는 공격의 85%가 DDoS 유형입니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>예측 분석</CardTitle>
            <CardDescription>AI 기반 위협 예측 및 권장사항</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border border-yellow-500/20 bg-yellow-500/10 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium text-yellow-500">주의 필요</span>
                </div>
                <p className="text-sm">내일 오후 시간대에 DDoS 공격 증가가 예상됩니다.</p>
              </div>
              <div className="p-4 border border-blue-500/20 bg-blue-500/10 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-blue-500">권장사항</span>
                </div>
                <p className="text-sm">중국 IP 대역에 대한 추가 모니터링을 권장합니다.</p>
              </div>
              <div className="p-4 border border-green-500/20 bg-green-500/10 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-green-500">개선 사항</span>
                </div>
                <p className="text-sm">차단 성공률이 지속적으로 향상되고 있습니다.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
