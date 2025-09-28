"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Shield, Clock, TrendingUp, TrendingDown } from "lucide-react"

export interface Metric {
  title: string
  value: string
  description: string
  icon: React.ReactNode
  color?: string
}

interface KeyMetricsProps {
  metrics: Metric[]
}

/**
 * 보안 분석 대시보드 상단의 주요 지표 카드
 * - 총 위협 탐지, 차단 성공률, 고위험 공격, 평균 응답 시간
 */
export default function KeyMetrics({ metrics }: KeyMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
            {metric.icon}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metric.color || ""}`}>{metric.value}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {metric.description}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
