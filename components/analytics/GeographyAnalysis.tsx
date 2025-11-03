"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Download } from "lucide-react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts"

interface CountryData {
  country: string
  threats: number
  blocked: number
  percentage: number
  color: string
}

interface GeographyAnalysisProps {
  apiKeyId: string
}

/**
 * 📊 GeographyAnalysis (API 키 기반)
 * - Supabase의 country_threats 테이블과 연결
 * - 국가별 위협 데이터 시각화 (막대그래프 + 상세표)
 */
export default function GeographyAnalysis({ apiKeyId }: GeographyAnalysisProps) {
  const [data, setData] = useState<CountryData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // ✅ 특정 API 키의 국가별 위협 데이터 불러오기
  useEffect(() => {
    const loadData = async () => {
      try {
        if (!apiKeyId) {
          setError("API 키가 제공되지 않았습니다.")
          return
        }

        const { data, error } = await supabase
          .from("country_threats")
          .select("country, threats, blocked, percentage")
          .eq("api_key_id", apiKeyId)
          .order("threats", { ascending: false })
          .limit(10)

        if (error) throw error
        if (!data) {
          setData([])
          return
        }

        // 🎨 색상 팔레트 자동 매핑
        const palette = [
          "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6",
          "#6366f1", "#a855f7", "#ec4899", "#14b8a6", "#f59e0b",
        ]

        const mapped = data.map((item, i) => ({
          country: item.country,
          threats: item.threats,
          blocked: item.blocked ?? 0,
          percentage: Number(item.percentage),
          color: palette[i % palette.length],
        }))

        setData(mapped)
      } catch (err: any) {
        console.error("🌍 지역 데이터 fetch 실패:", err.message)
        setError("데이터를 불러오는 중 오류가 발생했습니다.")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [apiKeyId])

  if (loading) return <div>📡 지역 데이터 불러오는 중...</div>
  if (error) return <div>⚠️ {error}</div>
  if (!data.length) return <div>🚫 국가별 데이터가 없습니다.</div>

  const totalThreats = data.reduce((sum, d) => sum + d.threats, 0)

  return (
    <div className="space-y-6">
      {/* 국가별 위협 분포 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>국가별 위협 분포</CardTitle>
            <CardDescription>위협의 지리적 분포 현황</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.map((country, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{country.country}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{country.threats}</div>
                      <div className="text-sm text-muted-foreground">
                        {country.percentage}%
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${country.percentage}%`,
                        backgroundColor: country.color,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 지역별 차단 현황 */}
        <Card>
          <CardHeader>
            <CardTitle>지역별 차단 현황</CardTitle>
            <CardDescription>국가별 IP 차단 통계</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="country" stroke="hsl(var(--border))" />
                <YAxis stroke="hsl(var(--border))" />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.03)" }}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="threats">
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 지역별 상세 분석 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>지역별 상세 분석</CardTitle>
              <CardDescription>각 지역의 위협 패턴과 차단 통계</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              리포트 다운로드
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3">국가</th>
                  <th className="text-left p-3">총 위협</th>
                  <th className="text-left p-3">차단된 공격</th>
                  <th className="text-left p-3">차단률</th>
                  <th className="text-left p-3">비율</th>
                </tr>
              </thead>
              <tbody>
                {data.map((country, index) => {
                  const blockRate =
                    country.threats > 0
                      ? ((country.blocked / country.threats) * 100).toFixed(1)
                      : "0"
                  return (
                    <tr key={index} className="border-b border-border/50">
                      <td className="p-3 font-medium">{country.country}</td>
                      <td className="p-3">{country.threats}</td>
                      <td className="p-3">{country.blocked}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          {blockRate}%
                        </Badge>
                      </td>
                      <td className="p-3">{country.percentage}%</td>
                    </tr>
                  )
                })}
                <tr className="font-semibold">
                  <td className="p-3">총합</td>
                  <td className="p-3">{totalThreats.toLocaleString()}</td>
                  <td className="p-3" colSpan={3}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
