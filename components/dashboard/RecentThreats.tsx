"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ThreatItem {
  id: number
  ip: string
  category: string
  attackName: string
  status: string
  time: string
  country?: string
}

const LABEL_CATEGORY_MAP: Record<string, string> = {
  BENIGN: "정상",
  // 디도스
  ICMP_FLOOD: "디도스",
  OTHER_TCP_FLOOD: "디도스",
  SYN_FLOOD: "디도스",
  UDP_AMPLIFY: "디도스",
  UDP_FLOOD: "디도스",

  // 정찰
  Port_Scan: "정찰",

  // 슬로우 공격
  Slowloris_Attack: "슬로우 공격",
}

const CATEGORY_EMOJI: Record<string, string> = {
  디도스: "💥",
  정찰: "🔎",
  "슬로우 공격": "🐢",
  unknown: "❓",
}

export default function RecentThreats({ apiKeyName }: { apiKeyName: string }) {
  const [threats, setThreats] = useState<ThreatItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const formatTime = (timestamp: string) => {
    if (!timestamp) return "-"
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return "-"
    const pad = (n: number) => n.toString().padStart(2, "0")
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  }

  const fetchThreats = async () => {
    setLoading(true)
    try {
      if (!apiKeyName) return

      // 1️⃣ api_keys 테이블에서 이름으로 id 조회
      const { data: keyData, error: keyError } = await supabase
        .from("api_keys")
        .select("id")
        .eq("name", apiKeyName)
        .single()

      if (keyError || !keyData) throw new Error("API 키 이름을 찾을 수 없습니다.")
      const apiKeyId = keyData.id

      // 2️⃣ incidents 테이블에서 최근 위협 3개 불러오기
      const { data, error } = await supabase
        .from("incidents")
        .select("id, source_ip, detection_result, top_candidates, status, time, country")
        .eq("api_key_id", apiKeyId)
        .order("time", { ascending: false })
        .limit(3)

      if (error) throw error

      // 3️⃣ 매핑
      const mapped = (data || []).map((item: any) => {
        // 공격 이름: detection_result 또는 top_candidates[0].label
        let attackName = item.detection_result ?? "UNKNOWN_ATTACK"
        if (item.top_candidates) {
          try {
            const parsed =
              typeof item.top_candidates === "string"
                ? JSON.parse(item.top_candidates)
                : item.top_candidates
            if (Array.isArray(parsed) && parsed.length > 0) {
              attackName = parsed[0].label ?? attackName
            }
          } catch {}
        }

        // 카테고리 매핑
        const category = LABEL_CATEGORY_MAP[attackName] ?? "unknown"

        return {
          id: item.id,
          ip: item.source_ip ?? "-",
          attackName,
          category,
          status: item.status ?? "active",
          time: formatTime(item.time),
          country: item.country ?? "",
        }
      })

      //정상 카테고리 넘김
      setThreats(mapped.filter(t=>t.category!=="정상"))
      setError(null)
    } catch (err: any) {
      console.error("🚨 RecentThreats fetch 실패:", err.message)
      setError("서버에서 데이터를 불러올 수 없습니다.")
      setThreats([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchThreats()
    const interval = setInterval(fetchThreats, 10000)
    return () => clearInterval(interval)
  }, [apiKeyName])

  return (
    <Card>
      <CardHeader>
        <CardTitle>최근 위협 활동</CardTitle>
        <CardDescription>
          {apiKeyName ? `API 키 "${apiKeyName}" 기준 실시간 위협 탐지 로그` : "API 키 이름이 선택되지 않았습니다."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-red-500 text-sm">{error}</p>
        ) : loading ? (
          <p className="text-muted-foreground text-sm">⏳ 불러오는 중...</p>
        ) : threats.length === 0 ? (
          <p className="text-sm text-muted-foreground">최근 위협 기록이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {threats.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition"
              >
                {/* 왼쪽: 이모지 + 카테고리 + 공격 이름 */}
                <div className="flex items-center gap-3">
                  <span className="text-lg">{CATEGORY_EMOJI[t.category] ?? "❓"}</span>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{t.category}</span>
                    <span className="font-mono text-xs text-muted-foreground">{t.attackName}</span>
                  </div>
                </div>

                {/* 오른쪽: 상태 + 시간 + IP */}
                <div className="flex flex-col items-end text-xs text-muted-foreground">
                  <span
                    className={
                      t.status === "resolved"
                        ? "text-green-500 font-medium"
                        : "text-red-500 font-medium"
                    }
                  >
                    {t.status}
                  </span>
                  <span>{t.time}</span>
                  <span className="font-mono">{t.ip}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
