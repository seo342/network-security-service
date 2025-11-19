"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Shield, Clock, TrendingUp } from "lucide-react"

// ✅ 모델 라벨 기준 분류 매핑
const LABEL_CATEGORY_MAP: Record<string, string> = {
  BENIGN: "정상",
  ICMP_FLOOD: "디도스",
  OTHER_TCP_FLOOD: "디도스",
  SYN_FLOOD: "디도스",
  UDP_AMPLIFY: "디도스",
  UDP_FLOOD: "디도스",
  Port_Scan: "정찰",
  Slowloris_Attack: "슬로우 공격",
}

interface KeyMetricsProps {
  apiKeyId: string
}

export default function KeyMetrics({ apiKeyId }: KeyMetricsProps) {
  const [metricsData, setMetricsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // ✅ metrics 계산
  useEffect(() => {
    const loadMetrics = async () => {
      setLoading(true)
      try {
        if (!apiKeyId) {
          setError("API 키가 제공되지 않았습니다.")
          setLoading(false)
          return
        }

        const { data: incidents, error: err } = await supabase
          .from("incidents")
          .select("detection_result, key_features_evidence")
          .eq("api_key_id", apiKeyId)
          .order("time", { ascending: false })
          .limit(1000)

        if (err) throw err

        if (!incidents || incidents.length === 0) {
          setMetricsData({
            total_threats: 0,
            attack_traffic_ratio: 0,
            ddos_count: 0,
            avg_flow_count: 0,
          })
          return
        }

        // ---------- 계산 ----------
        let total_threats = 0
        let total_flow_sum = 0
        let attack_flow_sum = 0
        let ddos_count = 0
        const flow_values: number[] = []

        for (const it of incidents) {
          const label = (it.detection_result ?? "BENIGN").toString().trim()
          const categoryName =
            LABEL_CATEGORY_MAP[label as keyof typeof LABEL_CATEGORY_MAP] ?? "기타"

          // ✅ BENIGN 아닌 건 위협
          if (label.toUpperCase() !== "BENIGN") total_threats++

          // ✅ 디도스만 카운트
          if (categoryName === "디도스") ddos_count++

          // ✅ 플로우 수 계산
          const fc = it.key_features_evidence?.core_metrics?.flow_count ?? 0
          const flow = Number(fc)
          if (!isNaN(flow) && flow > 0) {
            total_flow_sum += flow
            flow_values.push(flow)
            if (label.toUpperCase() !== "BENIGN") attack_flow_sum += flow
          }
        }

        // ✅ 비율 및 평균 계산
        const attack_traffic_ratio =
          total_flow_sum > 0 ? attack_flow_sum / total_flow_sum : 0
        const avg_flow_count =
          flow_values.length > 0
            ? flow_values.reduce((a, b) => a + b, 0) / flow_values.length
            : 0

        setMetricsData({
          total_threats,
          attack_traffic_ratio,
          ddos_count,
          avg_flow_count,
        })
      } catch (err: any) {
        console.error("❌ 데이터 로드 실패:", err.message)
        setError("데이터를 불러오지 못했습니다.")
      } finally {
        setLoading(false)
      }
    }

    loadMetrics()
  }, [apiKeyId])

  if (loading) return <div>📡 보안 지표 불러오는 중...</div>
  if (error) return <div>⚠️ {error}</div>
  if (!metricsData) return <div>🚫 데이터가 없습니다.</div>

  const metrics = [
    {
      title: "총 위협 탐지",
      value: metricsData.total_threats?.toLocaleString() || "0",
      description: "BENIGN 이외 탐지 건수",
      icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
      color: "text-red-500",
    },
    {
      title: "공격 트래픽 비율",
      value:
        metricsData.attack_traffic_ratio > 0
          ? `${(metricsData.attack_traffic_ratio * 100).toFixed(2)}%`
          : "0.00%",
      description: "비-BENIGN 플로우 합 / 전체 플로우 합",
      icon: <Shield className="h-4 w-4 text-green-500" />,
      color: "text-green-500",
    },
    {
      title: "디도스 공격 수",
      value: metricsData.ddos_count?.toLocaleString() || "0",
      description: "디도스 공격 건수",
      icon: <TrendingUp className="h-4 w-4 text-orange-500" />,
      color: "text-orange-500",
    },
    {
      title: "평균 플로우 수",
      value: `${metricsData.avg_flow_count.toFixed(2)}`,
      description: "평균 플로우 수",
      icon: <Clock className="h-4 w-4 text-blue-500" />,
      color: "text-blue-500",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
            {metric.icon}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metric.color}`}>
              {metric.value}
            </div>
            <div className="text-xs text-muted-foreground">
              {metric.description}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
