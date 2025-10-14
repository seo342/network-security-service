// app/dashboard/incidents/route.ts
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseServiceClient"

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("incidents")
      .select("id,time,source_ip,category,severity,status")
      .or("detection_result.neq.BENIGN,severity.eq.높음")
      .order("time", { ascending: false })
      .limit(50)

    if (error) throw error

    return NextResponse.json({ incidents: data })
  } catch (err: any) {
    console.error("🚨 /dashboard/incidents error:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
