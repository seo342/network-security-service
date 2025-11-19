"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface AnalyticsPageProps {
  apiKeyId: string
}

export default function AnalyticsPage({ apiKeyId }: AnalyticsPageProps) {
  const [selected, setSelected] = useState("metrics")
  const [loading, setLoading] = useState(true)
  const [apiKeyName, setApiKeyName] = useState<string>("")

  // ✅ API 키 이름 불러오기
  useEffect(() => {
    const fetchApiKey = async () => {
      const { data, error } = await supabase
        .from("api_keys")
        .select("name")
        .eq("id", apiKeyId)
        .single()
      if (!error && data) setApiKeyName(data.name)
      setLoading(false)
    }
    fetchApiKey()
  }, [apiKeyId])

  if (loading) return <p className="text-center py-10">🔄 분석 데이터 불러오는 중...</p>

  const menuItems = [
    { key: "metrics", label: "핵심 지표", icon: <BarChart3 className="h-4 w-4" /> },
    { key: "trends", label: "위협 동향", icon: <Activity className="h-4 w-4" /> },
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
        <h1 className="text-2xl font-bold mb-6">
          AI 위협 탐지 분석 리포트{" "}
          <span className="text-muted-foreground text-sm ml-2">
            (API Key: {apiKeyName || apiKeyId})
          </span>
        </h1>

        {/* ✅ 각 섹션별 컴포넌트 출력 (실제 DB 연동) */}
        {selected === "metrics" && <KeyMetrics apiKeyId={apiKeyId} />}
        {selected === "trends" && <ThreatTrends apiKeyId={apiKeyId} />}
        {selected === "patterns" && <PatternAnalysis apiKeyId={apiKeyId} />}
        {selected === "incidents" && <IncidentList apiKeyId={apiKeyId} />}
      </main>
    </div>
  )
}
