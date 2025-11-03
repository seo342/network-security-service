"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Download } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface IncidentDetails {
  core_metrics?: Record<string, number>
  protocol_signals?: {
    syn_flag_ratio: number
    tcp_ratio: number
    udp_ratio: number
    icmp_ratio: number
    fwd_bwd_pkt_ratio: number
    amplification_ports_hits: Record<string, number>
  }
  source_analysis?: Record<string, number>
  all_probabilities?: Record<string, number>
}

interface Incident {
  id: number
  time: string
  detection_result: string
  source_ip: string
  country: string
  category: string
  status: string
  details?: IncidentDetails
}

interface IncidentListProps {
  apiKeyId: string
}

export default function IncidentList({ apiKeyId }: IncidentListProps) {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>("전체")
  const [exporting, setExporting] = useState(false)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // ✅ 탐지 결과 → 카테고리 매핑
  const categoryMap: Record<string, string> = {
    BENIGN: "정상",
    ICMP_FLOOD: "디도스",
    OTHER_TCP_FLOOD: "디도스",
    SYN_FLOOD: "디도스",
    UDP_AMPLIFY: "디도스",
    UDP_FLOOD: "디도스",
    Port_Scan: "정찰",
    Slowloris_Attack: "슬로우 공격",
  }

  // ✅ Supabase 데이터 불러오기
  useEffect(() => {
    const loadIncidents = async () => {
      try {
        if (!apiKeyId) {
          setError("API 키가 제공되지 않았습니다.")
          return
        }

        console.log("[IncidentList] 데이터 로드 중...")

        // ✅ details → key_features_evidence 로 변경
        const { data, error } = await supabase
          .from("incidents")
          .select("id, time, detection_result, source_ip, country, status, key_features_evidence")
          .eq("api_key_id", Number(apiKeyId))
          .order("time", { ascending: false })
          .limit(50)

        if (error) throw error

        // ✅ key_features_evidence → details 로 매핑
        const mappedData = (data || []).map((item) => ({
          ...item,
          category: categoryMap[item.detection_result] || "기타",
          details: item.key_features_evidence, // ✅ 핵심 수정
        }))

        setIncidents(mappedData)
        setFilteredIncidents(mappedData)

        console.log("[IncidentList] 불러온 데이터:")
        console.table(mappedData)
      } catch (err: any) {
        console.error("incidents fetch 실패:", err.message)
        setError("데이터를 불러오지 못했습니다.")
      } finally {
        setLoading(false)
      }
    }

    loadIncidents()
  }, [apiKeyId])

  // ✅ 필터 적용
  useEffect(() => {
    if (categoryFilter === "전체") {
      setFilteredIncidents(incidents)
      console.log("[IncidentList] 필터: 전체")
    } else {
      const filtered = incidents.filter((i) => i.category === categoryFilter)
      setFilteredIncidents(filtered)
      console.log(`[IncidentList] 필터: ${categoryFilter}`)
    }
  }, [categoryFilter, incidents])

  // ✅ 카테고리 색상 지정
  const getCategoryColor = (category: string): "destructive" | "secondary" | "default" => {
    switch (category) {
      case "디도스":
        return "destructive"
      case "정찰":
        return "secondary"
      default:
        return "default"
    }
  }

  // ✅ PDF 내보내기 (현재 필터 상태)
  const exportToPDF = async () => {
    try {
      setExporting(true)
      console.log(`[IncidentList] PDF 내보내기 시작 (${categoryFilter})`)
      console.log(filteredIncidents)

      const payload = {
        format: "pdf",
        api_key_id: apiKeyId,
        category: categoryFilter,
        data: filteredIncidents,
      }

      const res = await fetch("/dashboard/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("PDF 생성 실패")

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `incident_report_${categoryFilter}.pdf`
      link.click()

      console.log(`[IncidentList] PDF 리포트 (${categoryFilter}) 생성 완료`)
    } catch (err) {
      console.error(err)
      alert("PDF 생성 중 오류가 발생했습니다.")
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <div>보안 사고 데이터를 불러오는 중...</div>
  if (error) return <div>⚠️ {error}</div>

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <CardTitle>최근 보안 사고</CardTitle>
            <CardDescription>탐지 결과 기반 카테고리 분류</CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="전체">전체</SelectItem>
                <SelectItem value="정상">정상</SelectItem>
                <SelectItem value="디도스">디도스</SelectItem>
                <SelectItem value="정찰">정찰</SelectItem>
                <SelectItem value="슬로우 공격">슬로우 공격</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={exportToPDF}
              disabled={exporting || filteredIncidents.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              PDF 내보내기
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredIncidents.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            해당 카테고리에 해당하는 보안 사고가 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIncidents.map((incident) => (
              <div
                key={incident.id}
                className="p-4 border border-border/50 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Badge variant={getCategoryColor(incident.category)}>
                      {incident.category}
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
                    <div className="font-mono">{incident.source_ip || "알 수 없음"}</div>
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

                <div className="mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const next = expanded === incident.id ? null : incident.id
                      setExpanded(next)
                      if (next)
                        console.log("[IncidentList] 상세 보기 열림:", incident.id, incident.details)
                      else console.log("[IncidentList] 상세 보기 닫힘:", incident.id)
                    }}
                    className="flex items-center text-sm text-blue-600"
                  >
                    {expanded === incident.id ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-1" /> 상세 닫기
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-1" /> 상세 보기
                      </>
                    )}
                  </Button>
                </div>

                {/* ✅ 상세 보기 섹션 */}
                {expanded === incident.id && incident.details && (
                  <div className="mt-4 p-3 border-t border-border/50 bg-muted/10 rounded-lg space-y-4 text-sm">
                    {incident.details.core_metrics && (
                      <div>
                        <h4 className="font-semibold mb-1">핵심 지표 (Core Metrics)</h4>
                        <ul className="list-disc list-inside space-y-1">
                          <li>플로우 개수: {incident.details.core_metrics.flow_count}</li>
                          <li>패킷 총합: {incident.details.core_metrics.packet_count_sum}</li>
                          <li>바이트 총합: {incident.details.core_metrics.byte_count_sum}</li>
                          <li>플로우 시작률: {incident.details.core_metrics.flow_start_rate}</li>
                          <li>출발지 IP 다양성: {incident.details.core_metrics.src_ip_nunique}</li>
                          <li>목적지 IP 다양성: {incident.details.core_metrics.dst_ip_nunique}</li>
                          <li>목적지 포트 다양성: {incident.details.core_metrics.dst_port_nunique}</li>
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
