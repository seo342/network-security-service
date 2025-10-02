// app/dashboard/traffic/route.ts
import { NextRequest, NextResponse } from "next/server"
import zlib from "zlib"

let latestLogs: any[] = []

export async function POST(req: NextRequest) {
  try {
    const rawBuffer = Buffer.from(await req.arrayBuffer())
    const decompressed = zlib.gunzipSync(rawBuffer)
    const data = JSON.parse(decompressed.toString("utf-8"))

    if (data?.packets) {
      latestLogs = data.packets
      console.log("✅ 새 데이터 수신:", latestLogs.length, "packets")
    }

    return NextResponse.json({ status: "ok", count: latestLogs.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json(latestLogs)
}
