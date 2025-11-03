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
  details?: any
}

interface IncidentListProps {
  apiKeyId: string
}

/**
 * 🚨 IncidentList (API 키 기반)
 * - Supabase `incidents` 테이블에서 특정 api_key_id로 필터링
 * - 최근 보안 사고 10건 표시
 */
export default function IncidentList({ apiKeyId }: IncidentListProps) {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // ✅ 심각도 색상 매핑
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

  // ✅ incidents 테이블에서 특정 API 키 기반 데이터 불러오기
  useEffect(() => {
    const loadIncidents = async () => {
      try {
        if (!apiKeyId) {
          setError("API 키가 제공되지 않았습니다.")
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
  }, [apiKeyId])

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
              {/* ✅ 상단 메타 정보 */}
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

              {/* ✅ 상세 정보 */}
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

              {/* ✅ details (JSON or string) */}
              {incident.details && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <span className="text-muted-foreground text-sm">상세 정보:</span>
                  {typeof incident.details === "object" ? (
                    <div className="text-sm mt-1 space-y-1">
                      {"notes" in incident.details && <p>📝 {incident.details.notes}</p>}
                      {"action" in incident.details && <p>⚙️ {incident.details.action}</p>}
                      {Object.entries(incident.details)
                        .filter(([k]) => !["notes", "action"].includes(k))
                        .map(([k, v]) => (
                          <p key={k}>
                            {k}: {String(v)}
                          </p>
                        ))}
                    </div>
                  ) : (
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
