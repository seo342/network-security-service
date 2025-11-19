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
  protocol_signals?: Record<string, any>
  source_analysis?: Record<string, number>
  all_probabilities?: Record<string, number>
}

interface Incident {
  id: number
  time: string
  detection_result: string
  category: string
  status: string
  confidence?: number
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

  // ✅ 색상 매핑
  const getCategoryColor = (category: string):
    | "destructive"
    | "secondary"
    | "warning"
    | "amber"
    | "default" => {
    switch (category) {
      case "디도스":
        return "destructive"
      case "정찰":
        return "warning" // 노란색
      case "슬로우 공격":
        return "amber" // 주황색
      case "정상":
        return "secondary"
      default:
        return "default"
    }
  }

  // ✅ Supabase에서 데이터 불러오기
  useEffect(() => {
    const loadIncidents = async () => {
      try {
        const { data, error } = await supabase
          .from("incidents")
          .select("id, time, detection_result, status, confidence, key_features_evidence")
          .eq("api_key_id", Number(apiKeyId))
          .order("time", { ascending: false })
          .limit(50)

        if (error) throw error

        const mappedData = (data || []).map((item) => ({
          ...item,
          category: categoryMap[item.detection_result] || "기타",
          details: item.key_features_evidence,
        }))

        setIncidents(mappedData)
        setFilteredIncidents(mappedData)
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
    if (categoryFilter === "전체") setFilteredIncidents(incidents)
    else setFilteredIncidents(incidents.filter((i) => i.category === categoryFilter))
  }, [categoryFilter, incidents])

  // ✅ PDF 내보내기
  const exportToPDF = async () => {
    try {
      setExporting(true)
      console.log(`[IncidentList] PDF 내보내기 시작 (${categoryFilter})`)

      const { data: apiKeyData } = await supabase
        .from("api_keys")
        .select("name")
        .eq("id", apiKeyId)
        .maybeSingle()

      const apiKeyName = apiKeyData?.name || `API_KEY_${apiKeyId}`

      const translateKeys = (obj: any): any => {
        if (!obj || typeof obj !== "object") return obj
        const map: Record<string, string> = {
          flow_count: "총 플로우 수",
          packet_count_sum: "패킷 총합",
          byte_count_sum: "바이트 총합",
          flow_start_rate: "초당 플로우 수",
          src_ip_nunique: "출발지 IP수",
          dst_ip_nunique: "목적지 IP수",
          dst_port_nunique: "목적지 포트",
          syn_flag_ratio: "SYN 플래그 비율",
          tcp_ratio: "TCP 비율",
          udp_ratio: "UDP 비율",
          icmp_ratio: "ICMP 비율",
          fwd_bwd_pkt_ratio: "패킷 방향 비율(F/B)",
          amplification_ports_hits: "증폭 포트 감지 횟수",
          top_src_count: "상위 출발지 수",
          top_dst_port_1: "주요 목적지 포트",
          top_dst_port_1_hits: "해당 포트 트래픽 수",
          src_ip_entropy: "출발지 IP 엔트로피",
          src_proto_bitmask_nunique: "프로토콜 다양성(Bitmask)",
          src_proto_multi_protocol_fraction: "멀티 프로토콜 비율",
        }

        const newObj: Record<string, any> = {}
        for (const [key, value] of Object.entries(obj)) {
          const translatedKey = map[key] || key
          newObj[translatedKey] =
            typeof value === "object" && value !== null ? translateKeys(value) : value
        }
        return newObj
      }

      const translatedData = filteredIncidents.map((item) => ({
        "API 키 이름": apiKeyName,
        "탐지 결과": item.detection_result,
        "카테고리": item.category,
        "상태": item.status,
        "탐지 시각": new Date(item.time).toLocaleString("ko-KR"),
        "핵심 지표 (Core Metrics)": translateKeys(item.details?.core_metrics || {}),
        "프로토콜 신호 (Protocol Signals)": translateKeys(item.details?.protocol_signals || {}),
        "소스 분석 (Source Analysis)": translateKeys(item.details?.source_analysis || {}),
        "탐지 확률 (All Probabilities)": translateKeys(item.details?.all_probabilities || {}),
      }))

      const payload = {
        format: "pdf",
        api_key_name: apiKeyName,
        category: categoryFilter,
        data: translatedData,
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
      link.download = `보안사고_${apiKeyName}_${categoryFilter}.pdf`
      link.click()
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
              <div key={incident.id} className="p-4 border border-border/50 rounded-lg">
                {/* 상단 정보 */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Badge
                      style={{
                        backgroundColor:
                          incident.category==="정찰" ? "#facc15"
                          : incident.category==="슬로우 공격"? "#fb923c"
                          : incident.category==="디도스" ? "#ef4444"
                          : incident.category==="정상"? "#e5e7eb":"#e5e7eb",
                          color:"black",
                      }}>
                      {incident.category}
                    </Badge>
                    <span className="font-medium">{incident.detection_result}</span>
                    <Badge variant="outline">{incident.status}</Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(incident.time).toLocaleString("ko-KR")}
                  </span>
                </div>

                {/* ✅ 핵심 지표 */}
                {incident.details?.core_metrics && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">① 핵심 지표 (Core Metrics)</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      {[
                        ["플로우 개수", incident.details.core_metrics.flow_count],
                        ["패킷 총합", incident.details.core_metrics.packet_count_sum],
                        ["초당 플로우 수", incident.details.core_metrics.flow_start_rate],
                        ["바이트 총합", incident.details.core_metrics.byte_count_sum],
                        ["목적지 포트 수", incident.details.core_metrics.dst_port_nunique],
                        ["신뢰도(%)", incident.confidence ? (incident.confidence * 100).toFixed(2) : "-"],
                      ].map(([label, value], idx) => (
                        <div key={idx}>
                          <div className="text-sm text-muted-foreground">{label}</div>
                          <div className="font-medium">{value ?? "-"}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 상세 보기 버튼 */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setExpanded(expanded === incident.id ? null : incident.id)
                  }
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

                {/* ✅ 상세 보기 */}
                {expanded === incident.id && (
                  <div className="mt-4 p-4 border-t border-border/50 bg-muted/10 rounded-lg space-y-4 text-sm">
                    {incident.details?.protocol_signals && (
                      <div>
                        <h4 className="font-semibold mb-1">(2) 프로토콜 신호</h4>
                        <div className="grid grid-cols-2 gap-4 text-center">
                          {[
                            ["SYN 플래그 비율", incident.details.protocol_signals.syn_flag_ratio],
                            ["TCP 비율", incident.details.protocol_signals.tcp_ratio],
                            ["UDP 비율", incident.details.protocol_signals.udp_ratio],
                            ["ICMP 비율", incident.details.protocol_signals.icmp_ratio],
                            ["패킷 방향 비율(F/B)", incident.details.protocol_signals.fwd_bwd_pkt_ratio],
                          ].map(([label, value], idx) => (
                            <div key={idx}>
                              <div className="text-sm text-muted-foreground">{label}</div>
                              <div className="font-medium">{value ?? "-"} </div>
                            </div>
                          ))}
                        </div>

                        {/* ✅ 증폭 포트 감지 (자동 추출 버전) */}
                        <div className="mt-3 text-left">
                          {(() => {
                            const hits = incident.details?.protocol_signals?.amplification_ports_hits || {}
                            const ports = Object.keys(hits)
                              .map((k) => k.match(/\((\d+)\)/)?.[1])
                              .filter(Boolean)
                              .join(", ")

                            return (
                              <>
                                <strong>● 증폭 포트 감지</strong>{" "}
                                {ports && (
                                  <span className="text-muted-foreground text-xs">({ports})</span>
                                )}
                                <div className="mt-1 text-xs">
                                  {Object.entries(hits)
                                    .filter(([_, v]) => (v as number) > 0)
                                    .map(([k, v]) => `${k}: ${v}`)
                                    .join(", ") || "없음"}
                                </div>
                              </>
                            )
                          })()}
                        </div>
                      </div>
                    )}

                    {incident.details?.source_analysis && (
                      <div>
                        <h4 className="font-semibold mb-1">(3) 소스 분석</h4>
                        <div className="grid grid-cols-2 gap-4 text-center">
                          {[
                            ["상위 출발지 수", incident.details.source_analysis.top_src_count],
                            ["주요 목적지 포트", incident.details.source_analysis.top_dst_port_1],
                            ["해당 포트 트래픽 수", incident.details.source_analysis.top_dst_port_1_hits],
                            ["출발지 IP 엔트로피", incident.details.source_analysis.src_ip_entropy],
                            ["프로토콜 다양성(Bitmask)", incident.details.source_analysis.src_proto_bitmask_nunique],
                            ["멀티 프로토콜 비율", incident.details.source_analysis.src_proto_multi_protocol_fraction],
                          ].map(([label, value], idx) => (
                            <div key={idx}>
                              <div className="text-sm text-muted-foreground">{label}</div>
                              <div className="font-medium">{value ?? "-"} </div>
                            </div>
                          ))}
                        </div>
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
