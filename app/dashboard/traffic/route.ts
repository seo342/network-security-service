import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseServiceClient"

export async function GET() {
  try {
    // ✅ 트래픽 로그
    const { data: trafficData, error: trafficError } = await supabaseAdmin
      .from("traffic_logs")
      .select("time, requests, threats")
      .order("time", { ascending: true })
      .limit(50)
    if (trafficError) throw trafficError

    // ✅ 위협 로그 (최근 50개)
    const { data: incidentData, error: incidentError } = await supabaseAdmin
      .from("incidents")
      .select("id, time, type, source_ip, severity, status")
      .order("time", { ascending: false })
      .limit(50)
    if (incidentError) throw incidentError

    return NextResponse.json({
      logs: trafficData,
      incidents: incidentData,
    })
  } catch (err: any) {
    console.error("❌ traffic/incidents fetch error:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
