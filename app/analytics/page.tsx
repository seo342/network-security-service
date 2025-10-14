"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// 분리된 기능들 import
import GeographyAnalysis from "@/components/analytics/GeographyAnalysis"
import IncidentList from "@/components/analytics/IncidentList"
import KeyMetrics from "@/components/analytics/KeyMetrics"
import PatternAnalysis from "@/components/analytics/PatternAnalysis"
import ThreatTrends from "@/components/analytics/ThreatTrends"
// --- Mock Data (실제로는 lib/mockData.ts 같은 곳에서 import 권장)
import { threatTrendData, attackTypeData, countryData, hourlyData, recentIncidents, mockMetrics } from "@/lib/mockData"

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("7d")

  // IncidentList에 넘겨줄 헬퍼
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "높음":
        return "destructive"
      case "중간":
        return "secondary"
      case "낮음":
        return "default"
      default:
        return "default"
    }
  }

  return (
    <div className="min-h-screen bg-background">

      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">위협 탐지 분석</h1>
          <p className="text-muted-foreground">
            AI 기반 위협 탐지 시스템의 상세 분석 리포트와 보안 인사이트를 확인하세요.
          </p>
        </div>

        {/* --- 분리된 컴포넌트들을 탭에 배치 --- */}
        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="metrics">핵심 지표</TabsTrigger>
            <TabsTrigger value="trends">위협 동향</TabsTrigger>
            <TabsTrigger value="geography">지역별 분석</TabsTrigger>
            <TabsTrigger value="patterns">패턴 분석</TabsTrigger>
            <TabsTrigger value="incidents">보안 사고</TabsTrigger>
          </TabsList>

          {/* 핵심 지표 */}
          <TabsContent value="metrics">
            <KeyMetrics metrics={mockMetrics}/>
          </TabsContent>

          {/* 위협 동향 */}
          <TabsContent value="trends">
            <ThreatTrends trendData={threatTrendData} attackTypeData={attackTypeData} />
          </TabsContent>

          {/* 지역별 분석 */}
          <TabsContent value="geography">
            <GeographyAnalysis data={countryData} />
          </TabsContent>

          {/* 패턴 분석 */}
          <TabsContent value="patterns">
            <PatternAnalysis />
          </TabsContent>

          {/* 보안 사고 */}
          <TabsContent value="incidents">
            <IncidentList incidents={recentIncidents} getSeverityColor={getSeverityColor} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
