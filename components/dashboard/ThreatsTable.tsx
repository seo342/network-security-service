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

  // ✅ Google Maps 스크립트 로드
  useEffect(() => {
    if (window.google && window.google.maps) {
      setMapLoaded(true)
      return
    }

    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&callback=initGoogleMap`
    script.async = true

    window.initGoogleMap = () => {
      console.log("✅ Google Maps SDK loaded")
      setMapLoaded(true)
    }

    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  // ✅ IP 정보 조회 (ipwho.is를 HTTPS로 사용)
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
        regionName:data.region,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

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

  // ✅ Google Map 렌더링
  useEffect(() => {
    if (!mapLoaded || !ipInfo?.lat || !ipInfo?.lon) return

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

    const infoWindow = new google.maps.InfoWindow({
      content: `<div style="font-size:13px">
        <b>${ipInfo.query}</b><br>${ipInfo.city || ""}, ${ipInfo.country}<br>${ipInfo.isp || ""}
      </div>`,
    })

    marker.addListener("click", () => infoWindow.open(map, marker))
  }, [mapLoaded, ipInfo])

  return (
    <Card className="p-4 space-y-4">
      <CardHeader>
        <CardTitle>위협 IP 분석 (Google Maps)</CardTitle>
      </CardHeader>
      <CardContent>
        {/* 🔹 IP 입력 */}
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="조회할 IP 주소 입력"
            value={queryIp}
            onChange={(e) => setQueryIp(e.target.value)}
          />
          <Button onClick={fetchIpInfo} disabled={loading}>
            {loading ? "조회 중..." : "조회"}
          </Button>
        </div>

        {/* 🔹 IP 정보 + 지도 */}
        {/* 🔹 IP 정보 + 지도 */}
          {ipInfo && (
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* 왼쪽: IP 상세 정보 */}
              <div className="text-sm space-y-4">
                {/* 위치 정보 */}
                <div className="border p-3 rounded-lg bg-muted/30">
                  <h4 className="font-semibold mb-2">🌍 위치 정보</h4>
                  <p><b>국가:</b> {ipInfo.country || "Unknown"}</p>
                  <p><b>도시:</b> {ipInfo.city || "Unknown"}</p>
                  <p><b>지역:</b> {ipInfo.regionName || "Unknown"}</p>
                  <p><b>위도:</b> {ipInfo.lat}</p>
                  <p><b>경도:</b> {ipInfo.lon}</p>
                </div>

                {/* 네트워크 정보 */}
                <div className="border p-3 rounded-lg bg-muted/30">
                  <h4 className="font-semibold mb-2">🏢 네트워크 정보</h4>
                  <p><b>ISP:</b> {ipInfo.isp || "Unknown"}</p>
                  <p><b>조직:</b> {ipInfo.org || "Unknown"}</p>
                  <p><b>IP 주소:</b> {ipInfo.query}</p>
                </div>
              </div>

              {/* 오른쪽: 지도 */}
              <div id="google-map" className="w-full h-[250px] border rounded-lg" />
            </div>
          )}


        {/* 🔹 DB 위협 목록 */}
        <h3 className="font-semibold mb-2">API 키 {apiKeyId} 기반 수집된 위협 IP 목록</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-muted">
              <tr>
                <th className="p-2 text-left">IP 주소</th>
                <th className="p-2 text-left">국가</th>
                <th className="p-2 text-left">위협도</th>
                <th className="p-2 text-left">탐지 시간</th>
              </tr>
            </thead>
            <tbody>
              {threatList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center p-4 text-muted-foreground">
                    데이터 없음
                  </td>
                </tr>
              ) : (
                threatList.map((item) => (
                  <tr key={item.id} className="border-t hover:bg-muted/30">
                    <td className="p-2">{item.ip_address}</td>
                    <td className="p-2">{item.country || "Unknown"}</td>
                    <td className="p-2">{item.threat_level || "알 수 없음"}</td>
                    <td className="p-2">
                      {new Date(item.detected_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
