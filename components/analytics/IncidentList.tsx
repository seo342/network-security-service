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

        const { data, error } = await supabase
          .from("incidents")
          .select("id, time, detection_result, status, key_features_evidence")
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
    if (categoryFilter === "전체") {
      setFilteredIncidents(incidents)
    } else {
      const filtered = incidents.filter((i) => i.category === categoryFilter)
      setFilteredIncidents(filtered)
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

  // ✅ PDF 내보내기 (전체 세부정보 포함 + 키 이름 표시 + 한글화)
  const exportToPDF = async () => {
    try {
      setExporting(true)
      console.log(`[IncidentList] PDF 내보내기 시작 (${categoryFilter})`)

      // 🔹 Supabase에서 API 키 이름 조회
      const { data: apiKeyData } = await supabase
        .from("api_keys")
        .select("name")
        .eq("id", apiKeyId)
        .maybeSingle()

      const apiKeyName = apiKeyData?.name || `API_KEY_${apiKeyId}`

      // 🔹 한글화된 필드 매핑 함수
      const translateKeys = (obj: any): any => {
        if (!obj || typeof obj !== "object") return obj
        const map: Record<string, string> = {
          flow_count: "플로우 개수",
          packet_count_sum: "패킷 총합",
          byte_count_sum: "바이트 총합",
          flow_start_rate: "플로우 시작률",
          src_ip_nunique: "출발지 IP 다양성",
          dst_ip_nunique: "목적지 IP 다양성",
          dst_port_nunique: "목적지 포트 다양성",
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
          if (typeof value === "object" && value !== null)
            newObj[translatedKey] = translateKeys(value)
          else newObj[translatedKey] = value
        }
        return newObj
      }

      // 🔹 변환된 incidents 데이터 생성
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

      // 🔹 PDF 생성 요청
      const payload = {
        format: "pdf",
        api_key_name: apiKeyName, // ✅ 키 이름으로 전달
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

                <div className="mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const next = expanded === incident.id ? null : incident.id
                      setExpanded(next)
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

                {expanded === incident.id && incident.details && (
                  <div className="mt-4 p-4 border-t border-border/50 bg-muted/10 rounded-lg space-y-4 text-sm">
                    {incident.details.core_metrics && (
                      <div>
                        <h4 className="font-semibold mb-1">① 핵심 지표 (Core Metrics)</h4>
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

                    {incident.details.protocol_signals && (
                      <div>
                        <h4 className="font-semibold mb-1">② 프로토콜 신호 (Protocol Signals)</h4>
                        <ul className="list-disc list-inside space-y-1">
                          <li>SYN 플래그 비율: {incident.details.protocol_signals.syn_flag_ratio}</li>
                          <li>TCP 비율: {incident.details.protocol_signals.tcp_ratio}</li>
                          <li>UDP 비율: {incident.details.protocol_signals.udp_ratio}</li>
                          <li>ICMP 비율: {incident.details.protocol_signals.icmp_ratio}</li>
                          <li>패킷 방향 비율(F/B): {incident.details.protocol_signals.fwd_bwd_pkt_ratio}</li>
                          <li>
                            증폭 포트 감지:{" "}
                            {Object.entries(
                              incident.details.protocol_signals.amplification_ports_hits || {}
                            )
                              .filter(([_, v]) => (v as number)> 0)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(", ") || "없음"}
                          </li>
                        </ul>
                      </div>
                    )}

                    {incident.details.source_analysis && (
                      <div>
                        <h4 className="font-semibold mb-1">③ 소스 분석 (Source Analysis)</h4>
                        <ul className="list-disc list-inside space-y-1">
                          <li>상위 출발지 수: {incident.details.source_analysis.top_src_count}</li>
                          <li>주요 목적지 포트: {incident.details.source_analysis.top_dst_port_1}</li>
                          <li>해당 포트 트래픽 수: {incident.details.source_analysis.top_dst_port_1_hits}</li>
                          <li>출발지 IP 엔트로피: {incident.details.source_analysis.src_ip_entropy}</li>
                          <li>프로토콜 다양성(Bitmask): {incident.details.source_analysis.src_proto_bitmask_nunique}</li>
                          <li>멀티 프로토콜 비율: {incident.details.source_analysis.src_proto_multi_protocol_fraction}</li>
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
