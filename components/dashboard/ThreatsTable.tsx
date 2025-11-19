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

declare global {
  interface Window {
    initGoogleMap: any
  }
}

export default function ThreatIpAnalysis({ apiKeyId }: { apiKeyId: string }) {
  const [queryIp, setQueryIp] = useState("")
  const [ipInfo, setIpInfo] = useState<any>(null)
  const [threatList, setThreatList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [apiKeyName, setApiKeyName] = useState<string>("")

  // ✅ API 키 이름 조회
  useEffect(() => {
    const fetchApiKeyName = async () => {
      if (!apiKeyId) return
      const { data } = await supabase
        .from("api_keys")
        .select("name")
        .eq("id", apiKeyId)
        .maybeSingle()

      if (data) setApiKeyName(data.name)
    }
    fetchApiKeyName()
  }, [apiKeyId])

  // ✅ Google Maps SDK 로드
  useEffect(() => {
    if (window.google && window.google.maps) {
      setMapLoaded(true)
      return
    }

    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&callback=initGoogleMap`
    script.async = true

    window.initGoogleMap = () => setMapLoaded(true)

    document.head.appendChild(script)
    return () => document.head.removeChild(script)
  }, [])

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

  // ✅ Supabase 위협 IP 목록 불러오기
  const loadThreatList = async () => {
    const { data } = await supabase
      .from("threat_ips")
      .select("*")
      .eq("api_key_id", apiKeyId)
      .order("detected_at", { ascending: false })
      .limit(30)

    if (data) setThreatList(data)
  }

  useEffect(() => {
    loadThreatList()
  }, [apiKeyId])

  // ✅ ai_features.events 안전 추출
  const getEventList = (item: any) => {
    if (!item?.ai_features) return []
    if (Array.isArray(item.ai_features.events)) return item.ai_features.events
    return []
  }

  // ✅ Google Maps 렌더링
  useEffect(() => {
    if (!mapLoaded || !ipInfo?.lat) return

    const mapContainer = document.getElementById("google-map") as HTMLElement
    if (!mapContainer) return

    const position = { lat: ipInfo.lat, lng: ipInfo.lon }

    const map = new google.maps.Map(mapContainer, {
      center: position,
      zoom: 6,
    })

    const marker = new google.maps.Marker({
      position,
      map,
      title: ipInfo.query,
    })
  }, [mapLoaded, ipInfo])

  return (
    <Card className="p-4 space-y-4">
      <CardHeader>
        <CardTitle className="text-xl font-bold">
          위협 IP 분석 (지도 + 히트 이벤트)
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* 🔹 IP 검색 */}
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

        {/* 🔹 IP 정보 + 지도 */}
        {ipInfo && (
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* 왼쪽 정보 */}
            <div className="space-y-5">
              <div className="border p-4 rounded-lg bg-muted/20 shadow-sm">
                <h4 className="font-semibold mb-2 text-xl">🌍 위치 정보</h4>
                <p><b>국가:</b> {ipInfo.country}</p>
                <p><b>도시:</b> {ipInfo.city}</p>
                <p><b>지역:</b> {ipInfo.regionName}</p>
                <p><b>위도:</b> {ipInfo.lat}</p>
                <p><b>경도:</b> {ipInfo.lon}</p>
              </div>

              <div className="border p-4 rounded-lg bg-muted/20 shadow-sm">
                <h4 className="font-semibold mb-2 text-xl">🏢 네트워크 정보</h4>
                <p><b>ISP:</b> {ipInfo.isp}</p>
                <p><b>조직:</b> {ipInfo.org}</p>
                <p><b>IP:</b> {ipInfo.query}</p>
              </div>
            </div>

            {/* 오른쪽 지도 */}
            <div
              id="google-map"
              className="w-full h-[420px] border rounded-xl shadow-md"
            />
          </div>
        )}

        {/* 🔹 위협 목록 */}
        <h3 className="font-semibold mb-4 text-lg">
          {apiKeyName
            ? `${apiKeyName} 기반 수집된 위협 IP 목록`
            : `API 키 ${apiKeyId} 기반 수집된 위협 IP 목록`}
        </h3>

        {threatList.length === 0 ? (
          <p className="text-center text-base p-4 text-muted-foreground">
            수집된 데이터 없음
          </p>
        ) : (
          <div className="space-y-8">
            {threatList.map((item) => (
              <div
                key={item.id}
                className="border rounded-xl p-6 bg-muted/10 shadow-sm hover:shadow-md transition-shadow"
              >
                <h4 className="font-semibold text-xl mb-3">
                  {item.ip_address}
                  <span className="text-sm text-gray-500 ml-2">
                    ({new Date(item.detected_at).toLocaleString()})
                  </span>
                </h4>

                {/* 이벤트 히트 테이블 */}
                <div className="border-t pt-3 mt-3">
                  <table className="w-full text-base">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="py-2">시간</th>
                        <th className="py-2 text-right">히트 수</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getEventList(item).length === 0 ? (
                        <tr>
                          <td
                            colSpan={2}
                            className="text-center py-4 text-muted-foreground text-sm"
                          >
                            이벤트 데이터 없음
                          </td>
                        </tr>
                      ) : (
                        getEventList(item).map((e: any, idx: number) => (
                          <tr key={idx} className="border-t hover:bg-muted/20">
                            <td className="py-2 text-sm">
                              {new Date(e.time).toLocaleString()}
                            </td>
                            <td className="py-2 text-right font-medium text-sm">
                              {e.count.toLocaleString()}
                            </td>
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
