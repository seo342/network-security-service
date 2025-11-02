"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import BlockedIPs from "@/components/dashboard/BlockedIPsTabs"
import RecentThreats from "@/components/dashboard/RecentThreats"
import Settings from "@/components/dashboard/SettingsTab"
import StatsCards from "@/components/dashboard/StatsCards"
import SystemStatus from "@/components/dashboard/SystemStatus"
import ThreatTable from "@/components/dashboard/ThreatsTable"
import TrafficChart from "@/components/dashboard/TrafficChart"
import ApiUsage from "@/components/dashboard/ApiUsage"
import AnalyticsPanel from "@/components/analytics/AnalyticsPanel"

// ✅ 새 통합 버전
import PacketLogDashboard from "@/components/dashboard/TrafficLogs"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function DashboardPage() {
  const { id } = useParams() as { id: string } // ✅ URL에서 API 키 ID 읽기
  const [apiKey, setApiKey] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // ✅ 통계 및 차트 Mock
  const generateMockData = () => {
    const now = new Date()
    const data = []
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000)
      data.push({
        time: time.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        requests: Math.floor(Math.random() * 1000) + 500,
        threats: Math.floor(Math.random() * 50) + 10,
      })
    }
    return data
  }

  const mockBlockedIPs = [
    { ip: "14.44.444.44", country: "북한", reason: "위험 국가", blockedAt: "17:11:13" },
    { ip: "123.45.67.89", country: "중국", reason: "DDoS 공격", blockedAt: "16:45:22" },
  ]

  const [chartData, setChartData] = useState(generateMockData())
  const [stats, setStats] = useState({
    totalRequests: 0,
    threatsDetected: 0,
    blockedIPs: 0,
    uptime: "99.9%",
  })

  // ✅ API 키 정보 로드
  useEffect(() => {
    const loadKey = async () => {
      if (!id) return
      const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .eq("id", id)
        .single()

      if (error) console.error("❌ API 키 불러오기 실패:", error)
      else setApiKey(data)

      setLoading(false)
    }
    loadKey()
  }, [id])

  // ✅ 실시간 업데이트 시뮬레이션
  useEffect(() => {
    const interval = setInterval(() => {
      setChartData(generateMockData())
      setStats((prev) => ({
        ...prev,
        totalRequests: prev.totalRequests + Math.floor(Math.random() * 10),
        threatsDetected: prev.threatsDetected + Math.floor(Math.random() * 2),
      }))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <p className="text-center py-10">🔄 로딩 중...</p>
  if (!apiKey) return <p className="text-center py-10">❌ 유효하지 않은 API 키입니다.</p>

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <h2 className="text-xl font-semibold mb-6">
          🔐 {apiKey.name} 대시보드
          <span className="text-sm text-muted-foreground ml-2">
            ({apiKey.status.toUpperCase()})
          </span>
        </h2>

        {/* 상단 통계 */}
        <StatsCards apiKeyId={id} stats={stats} />

        {/* 탭 영역 */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="logs">트래픽 로그</TabsTrigger>
            <TabsTrigger value="threats">위협 분석</TabsTrigger>
            <TabsTrigger value="blocked">차단된 IP</TabsTrigger>
            <TabsTrigger value="analytics">분석</TabsTrigger>
            <TabsTrigger value="settings">설정</TabsTrigger>
          </TabsList>

          {/* 📊 개요 */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TrafficChart apiKeyId={id} data={chartData} />
              <ApiUsage apiKeyId={id} />
              <RecentThreats apiKeyId={id} />
              <SystemStatus />
            </div>
          </TabsContent>

          {/* 📜 트래픽 로그 */}
          <TabsContent value="logs">
            <PacketLogDashboard apiKeyId={id} />
          </TabsContent>

          {/* 🚨 위협 분석 */}
          <TabsContent value="threats">
            <ThreatTable apiKeyId={id} />
          </TabsContent>

          {/* 🚫 차단된 IP */}
          <TabsContent value="blocked">
            <BlockedIPs apiKeyId={id} blockedIPs={mockBlockedIPs} />
          </TabsContent>

          {/* 📈 분석 */}
          <TabsContent value="analytics">
            <AnalyticsPanel apiKeyId={id} />
          </TabsContent>

          {/* ⚙️ 설정 */}
          <TabsContent value="settings">
            <Settings apiKeyId={id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
