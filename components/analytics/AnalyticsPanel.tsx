"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  Activity,
  MapPin,
  ListOrdered,
  AlertTriangle,
} from "lucide-react"

import GeographyAnalysis from "@/components/analytics/GeographyAnalysis"
import IncidentList from "@/components/analytics/IncidentList"
import KeyMetrics from "@/components/analytics/KeyMetrics"
import PatternAnalysis from "@/components/analytics/PatternAnalysis"
import ThreatTrends from "@/components/analytics/ThreatTrends"
import {
  threatTrendData,
  attackTypeData,
  countryData,
  recentIncidents,
  mockMetrics,
} from "@/lib/mockData"

export default function AnalyticsPage() {
  const [selected, setSelected] = useState("metrics")

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

  // 사이드바 버튼 정의
  const menuItems = [
    { key: "metrics", label: "핵심 지표", icon: <BarChart3 className="h-4 w-4" /> },
    { key: "trends", label: "위협 동향", icon: <Activity className="h-4 w-4" /> },
    { key: "geography", label: "지역별 분석", icon: <MapPin className="h-4 w-4" /> },
    { key: "patterns", label: "패턴 분석", icon: <ListOrdered className="h-4 w-4" /> },
    { key: "incidents", label: "보안 사고", icon: <AlertTriangle className="h-4 w-4" /> },
  ]

  return (
    <div className="min-h-screen flex bg-background">
      {/* 📁 왼쪽 사이드바 */}
      <aside className="w-56 border-r bg-card p-4 space-y-2">
        <h2 className="text-lg font-bold mb-4">분석 메뉴</h2>
        {menuItems.map((item) => (
          <Button
            key={item.key}
            variant={selected === item.key ? "default" : "ghost"}
            className="w-full justify-start gap-2"
            onClick={() => setSelected(item.key)}
          >
            {item.icon}
            {item.label}
          </Button>
        ))}
      </aside>

      {/* 📊 오른쪽 콘텐츠 영역 */}
      <main className="flex-1 p-6 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-6">AI 위협 탐지 분석 리포트</h1>

        {selected === "metrics" && (
          <div className="space-y-4">
            <KeyMetrics metrics={mockMetrics} />
          </div>
        )}

        {selected === "trends" && (
          <div className="space-y-4">
            <ThreatTrends trendData={threatTrendData} attackTypeData={attackTypeData} />
          </div>
        )}

        {selected === "geography" && (
          <div className="space-y-4">
            <GeographyAnalysis data={countryData} />
          </div>
        )}

        {selected === "patterns" && (
          <div className="space-y-4">
            <PatternAnalysis />
          </div>
        )}

        {selected === "incidents" && (
          <div className="space-y-4">
            <IncidentList
              incidents={recentIncidents}
              getSeverityColor={getSeverityColor}
            />
          </div>
        )}
      </main>
    </div>
  )
}
