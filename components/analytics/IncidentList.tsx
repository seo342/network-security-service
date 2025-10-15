"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Filter, Download } from "lucide-react"

interface Incident {
  id: number
  time: string
  detection_result: string
  source_ip: string
  country: string
  severity: string
  status: string
  details?: any // ✅ string | object 모두 대응
}

export default function IncidentList() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // ✅ 로그인한 유저의 API 키 ID 가져오기
  const getUserApiKeyId = async (): Promise<number | null> => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) return null

      const { data, error } = await supabase
        .from("api_keys")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (error) return null
      return data?.id ?? null
    } catch (err) {
      console.error("getUserApiKeyId 오류:", err)
      return null
    }
  }

  // ✅ 심각도 색상 매핑 함수
  const getSeverityColor = (severity: string): "destructive" | "secondary" | "default" => {
    switch (severity) {
      case "높음":
      case "High":
        return "destructive"
      case "중간":
      case "Medium":
        return "secondary"
      default:
        return "default"
    }
  }

  // ✅ incidents 테이블에서 최근 보안 사고 불러오기
  useEffect(() => {
    const loadIncidents = async () => {
      try {
        const apiKeyId = await getUserApiKeyId()
        if (!apiKeyId) {
          setError("API 키를 찾을 수 없습니다.")
          return
        }

        const { data, error } = await supabase
          .from("incidents")
          .select("id, time, detection_result, source_ip, country, severity, status, details")
          .eq("api_key_id", apiKeyId)
          .order("time", { ascending: false })
          .limit(10)

        if (error) throw error
        setIncidents(data || [])
      } catch (err: any) {
        console.error("🚨 incidents fetch 실패:", err.message)
        setError("데이터를 불러오지 못했습니다.")
      } finally {
        setLoading(false)
      }
    }

    loadIncidents()
  }, [])

  if (loading) return <div>📡 보안 사고 데이터를 불러오는 중...</div>
  if (error) return <div>⚠️ {error}</div>
  if (!incidents.length) return <div>🚫 최근 보안 사고가 없습니다.</div>

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>최근 보안 사고</CardTitle>
            <CardDescription>실시간 보안 사고 및 대응 현황</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              필터
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              내보내기
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {incidents.map((incident) => (
            <div
              key={incident.id}
              className="p-4 border border-border/50 rounded-lg hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Badge variant={getSeverityColor(incident.severity)}>
                    {incident.severity}
                  </Badge>
                  <span className="font-medium">{incident.detection_result}</span>
                  <Badge variant="outline">{incident.status}</Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  {new Date(incident.time).toLocaleString("ko-KR")}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">출발지 IP:</span>
                  <div className="font-mono">{incident.source_ip}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">국가:</span>
                  <div>{incident.country || "알 수 없음"}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">상태:</span>
                  <div>{incident.status}</div>
                </div>
              </div>

              {/* ✅ details 안전 렌더링 */}
              {incident.details && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <span className="text-muted-foreground text-sm">상세 정보:</span>

                  {/* 객체일 경우 */}
                  {typeof incident.details === "object" ? (
                    <div className="text-sm mt-1 space-y-1">
                      {"notes" in incident.details && (
                        <p>📝 {incident.details.notes}</p>
                      )}
                      {"action" in incident.details && (
                        <p>⚙️ {incident.details.action}</p>
                      )}
                      {/* 나머지 키 자동 출력 */}
                      {Object.entries(incident.details)
                        .filter(([k]) => !["notes", "action"].includes(k))
                        .map(([k, v]) => (
                          <p key={k}>
                            {k}: {String(v)}
                          </p>
                        ))}
                    </div>
                  ) : (
                    // 문자열일 경우
                    <p className="text-sm mt-1">{incident.details}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
