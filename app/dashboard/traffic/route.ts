import { NextResponse } from "next/server"
import zlib from "zlib"

// 서버 메모리에 최근 로그 저장 (임시 저장소)
let latestLogs: any[] = []

// 🚀 Python agent → POST
export async function POST(req: Request) {
  try {
    // body는 gzip 압축 → Buffer로 변환
    const arrayBuffer = await req.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // gzip 해제
    const decompressed = zlib.gunzipSync(buffer).toString("utf-8")
    const payload = JSON.parse(decompressed)

    console.log("✅ Received payload:", payload)

    // 받은 패킷 로그 저장
    if (payload.packets && Array.isArray(payload.packets)) {
      latestLogs = payload.packets
    }

    // 에이전트한테 OK 응답
    return NextResponse.json({ ok: true, received: payload.packets?.length || 0 })
  } catch (e) {
    console.error("❌ Failed to handle POST:", e)
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }
}

// 🚀 프론트엔드 → GET
export async function GET(req: Request) {
  // latestLogs 가 비어있으면 샘플 로그 반환
  const logs = latestLogs.length > 0 ? latestLogs : [
    {
      timestamp: new Date().toISOString(),
      src_ip: "192.168.0.1",
      dst_ip: "8.8.8.8",
      protocol: "TCP",
      tcp_flags: "SYN",
      tcp_seq: 12345,
      payload: "TestPayload",
      packet_size: 128,
    },
  ]

  return NextResponse.json({ logs })
}
