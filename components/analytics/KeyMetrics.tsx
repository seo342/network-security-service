"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Shield, Clock, TrendingUp } from "lucide-react"

/**
 * 📊 KeyMetrics (통합형)
 * - metrics_summary 테이블에서 api_key_id 기준으로 최신 데이터 조회
 * - 카드 형태로 주요 보안 지표 표시
 */
export default function KeyMetrics() {
  const [metricsData, setMetricsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ✅ Supabase 클라이언트 생성
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // ✅ 로그인한 유저의 API 키 ID 조회 함수
  const getUserApiKeyId = async (): Promise<number | null> => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error("❌ 로그인 정보 없음:", userError?.message)
        return null
      }

      const { data, error } = await supabase
        .from("api_keys")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error("❌ API 키 조회 실패:", error.message)
        return null
      }

      return data?.id ?? null
    } catch (err) {
      console.error("🚨 getUserApiKeyId 오류:", err)
      return null
    }
  }

  // ✅ metrics_summary 테이블에서 데이터 불러오기
  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const apiKeyId = await getUserApiKeyId()
        if (!apiKeyId) {
          setError("API 키를 찾을 수 없습니다.")
          return
        }

        const { data, error } = await supabase
          .from("metrics_summary")
          .select("total_threats, block_rate, high_risk_attacks, avg_response_time")
          .eq("api_key_id", apiKeyId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        if (error) throw error
        setMetricsData(data)
      } catch (err: any) {
        console.error("📊 데이터 로드 실패:", err.message)
        setError("데이터를 불러오지 못했습니다.")
      } finally {
        setLoading(false)
      }
    }

    loadMetrics()
  }, [])

  // ✅ 상태 처리
  if (loading) return <div>📡 보안 지표 불러오는 중...</div>
  if (error) return <div>⚠️ {error}</div>
  if (!metricsData) return <div>🚫 데이터가 없습니다.</div>

  // ✅ 카드 데이터 구성
  const metrics = [
    {
      title: "총 위협 탐지",
      value: metricsData.total_threats?.toLocaleString() || "0",
      description: "누적된 위협 탐지 횟수",
      icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
      color: "text-red-500",
    },
    {
      title: "차단 성공률",
      value: `${(Number(metricsData.block_rate) * 100).toFixed(1)}%`,
      description: "탐지된 위협 중 차단된 비율",
      icon: <Shield className="h-4 w-4 text-green-500" />,
      color: "text-green-500",
    },
    {
      title: "고위험 공격",
      value: metricsData.high_risk_attacks?.toLocaleString() || "0",
      description: "위험도 높은 공격 시도",
      icon: <TrendingUp className="h-4 w-4 text-orange-500" />,
      color: "text-orange-500",
    },
    {
      title: "평균 응답 시간",
      value: `${Number(metricsData.avg_response_time).toFixed(2)} ms`,
      description: "공격 대응 평균 시간",
      icon: <Clock className="h-4 w-4 text-blue-500" />,
      color: "text-blue-500",
    },
  ]

  // ✅ 카드 렌더링
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
            {metric.icon}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metric.color || ""}`}>
              {metric.value}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {metric.description}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
