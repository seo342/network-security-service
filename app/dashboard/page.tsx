"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// 분리된 대시보드 컴포넌트
import BlockedIPs from "@/components/dashboard/BlockedIPsTabs"
import RecentThreats from "@/components/dashboard/RecentThreats"
import Settings from "@/components/dashboard/SettingsTab"
import StatsCards from "@/components/dashboard/StatsCards"
import SystemStatus from "@/components/dashboard/SystemStatus"
import ThreatTable from "@/components/dashboard/ThreatsTable"
import TrafficChart from "@/components/dashboard/TrafficChart"
import TrafficLogs from "@/components/dashboard/TrafficLogs"
import PacketLogFilters, { PacketFilterState } from "@/components/dashboard/PacketLogFilters"
import ApiUsage from "@/components/api/ApiUsage"
import AnalyticsPanel from "@/components/analytics/AnalyticsPanel"

// Mock 데이터
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

export default function DashboardPage() {
  const [chartData, setChartData] = useState(generateMockData())
  const [stats, setStats] = useState({
    totalRequests: 1024,
    threatsDetected: 42,
    blockedIPs: 15,
    uptime: "99.9%",
  })

  // ✅ 필터 상태
  const [filters, setFilters] = useState<PacketFilterState>({
    timeRange: "30m",
    protocols: { TCP: true, UDP: true, ICMP: true, OTHER: true },
  })

  // 실시간 업데이트 시뮬레이션
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* 상단 통계 */}
        <StatsCards/>

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

          {/* 개요 */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TrafficChart/>
              <ApiUsage/>
              <RecentThreats />
              <SystemStatus />
            </div>
          </TabsContent>

          {/* 트래픽 로그 */}
          <TabsContent value="logs">
            <div className="flex gap-4">
              {/* 좌측: 필터창 */}
              <PacketLogFilters filters={filters} setFilters={setFilters} />

              {/* 우측: 로그 테이블 */}
              <TrafficLogs />
            </div>
          </TabsContent>

          {/* 위협 분석 */}
          <TabsContent value="threats">
            <ThreatTable/>
          </TabsContent>

          {/* 차단된 IP */}
          <TabsContent value="blocked">
            <BlockedIPs blockedIPs={mockBlockedIPs} />
          </TabsContent>


          <TabsContent value="analytics">
            <AnalyticsPanel />
          </TabsContent>

          {/* 설정 */}
          <TabsContent value="settings">
            <Settings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
