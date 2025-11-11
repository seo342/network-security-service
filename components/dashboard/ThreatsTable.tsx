"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ThreatIpAnalysis({ apiKeyId }: { apiKeyId: string }) {
  const [queryIp, setQueryIp] = useState("")
  const [ipInfo, setIpInfo] = useState<any>(null)
  const [threatList, setThreatList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [apiKeyName, setApiKeyName] = useState<string>("")

  // ✅ API 키 이름 조회
  useEffect(() => {
    const fetchApiKeyName = async () => {
      if (!apiKeyId) return
      const { data, error } = await supabase
        .from("api_keys")
        .select("name")
        .eq("id", apiKeyId)
        .maybeSingle()

      if (!error && data) setApiKeyName(data.name)
    }
    fetchApiKeyName()
  }, [apiKeyId])

  // ✅ Supabase에서 위협 IP 목록 불러오기
  const loadThreatList = async () => {
    if (!apiKeyId) return
    const { data, error } = await supabase
      .from("threat_ips")
      .select("*")
      .eq("api_key_id", apiKeyId)
      .order("detected_at", { ascending: false })
      .limit(30)

    if (!error && data) setThreatList(data)
  }

  useEffect(() => {
    loadThreatList()
  }, [apiKeyId])

  // ✅ IP 정보 조회
  const fetchIpInfo = async () => {
    if (!queryIp) return
    setLoading(true)
    try {
      const res = await fetch(`https://ipwho.is/${queryIp}`)
      const data = await res.json()
      if (data.success === false) {
        alert("IP 정보를 가져올 수 없습니다.")
        return
      }
      setIpInfo({
        country: data.country,
        city: data.city,
        isp: data.connection?.isp,
        org: data.connection?.org,
        lat: data.latitude,
        lon: data.longitude,
        query: data.ip,
        regionName: data.region,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // ✅ ai_features 내부의 events 안전 추출
  const getEventList = (item: any) => {
    if (!item?.ai_features) return []
    if (Array.isArray(item.ai_features.events)) return item.ai_features.events
    return []
  }

  return (
    <Card className="p-4 space-y-4">
      <CardHeader>
        <CardTitle className="text-xl font-bold">
          위협 IP 분석 (히트 수 & 시간)
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* 🔹 IP 입력 */}
        <div className="flex gap-2 mb-6">
          <Input
            placeholder="조회할 IP 주소 입력"
            value={queryIp}
            onChange={(e) => setQueryIp(e.target.value)}
            className="text-lg p-3"
          />
          <Button onClick={fetchIpInfo} disabled={loading} className="text-lg px-6">
            {loading ? "조회 중..." : "조회"}
          </Button>
        </div>

        {/* 🔹 Supabase DB 위협 목록 */}
        <h3 className="font-semibold mb-3 text-lg">
          {apiKeyName
            ? `${apiKeyName} 기반 수집된 위협 IP 목록`
            : `API 키 ${apiKeyId} 기반 수집된 위협 IP 목록`}
        </h3>

        {threatList.length === 0 ? (
          <p className="text-center text-muted-foreground text-base p-5">
            데이터 없음
          </p>
        ) : (
          <div className="space-y-6">
            {threatList.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 bg-muted/10 shadow-sm">
                <h4 className="font-semibold text-lg mb-2">
                  {item.ip_address}
                  <span className="text-sm text-gray-500 ml-2">
                    ({new Date(item.detected_at).toLocaleString()})
                  </span>
                </h4>

                <div className="border-t pt-2 mt-2">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500">
                        <th className="py-1">시간</th>
                        <th className="py-1 text-right">히트 수</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getEventList(item).length === 0 ? (
                        <tr>
                          <td colSpan={2} className="text-center py-2 text-muted-foreground">
                            이벤트 데이터 없음
                          </td>
                        </tr>
                      ) : (
                        getEventList(item).map((e: any, idx: number) => (
                          <tr key={idx} className="border-t hover:bg-muted/20">
                            <td>{new Date(e.time).toLocaleString()}</td>
                            <td className="text-right">{e.count.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
