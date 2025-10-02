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

const mockThreatData = [
  { id: 1, ip: "192.168.56.11", country: "대한민국", status: "정상", time: "14:22:10", type: "normal" },
  { id: 2, ip: "8.8.8.8", country: "미국", status: "경고", time: "15:11:11", type: "warning" },
  { id: 3, ip: "14.44.444.44", country: "북한", status: "위험", time: "17:11:13", type: "danger" },
]

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
        <StatsCards stats={stats} />

        {/* 탭 영역 */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="logs">트래픽 로그</TabsTrigger>
            <TabsTrigger value="threats">위협 분석</TabsTrigger>
            <TabsTrigger value="blocked">차단된 IP</TabsTrigger>
            <TabsTrigger value="settings">설정</TabsTrigger>
          </TabsList>

          {/* 개요 */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TrafficChart data={chartData} />
              <RecentThreats />
              <SystemStatus />
            </div>
          </TabsContent>

          {/* 트래픽 로그 */}
          <TabsContent value="logs">
            <TrafficLogs />
          </TabsContent>

          {/* 위협 분석 */}
          <TabsContent value="threats">
            <ThreatTable threats={mockThreatData} />
          </TabsContent>

          {/* 차단된 IP */}
          <TabsContent value="blocked">
            <BlockedIPs blockedIPs={mockBlockedIPs} />
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
