import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ip = searchParams.get("ip")

  if (!ip) {
    return NextResponse.json({ error: "IP required" }, { status: 400 })
  }

  try {
    // 서버 환경에서는 HTTP 호출 가능
    const res = await fetch(`http://ip-api.com/json/${ip}?lang=ko`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
