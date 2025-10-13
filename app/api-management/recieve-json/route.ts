import { NextResponse } from "next/server"

// 분석서버에서 JSON을 받을 엔드포인트
export async function POST(req: Request) {
  try {
    // JSON body 파싱
    const data = await req.json()

    console.log("📥 받은 JSON 데이터:", data)

    // TODO: 받은 데이터를 Supabase에 저장하거나 처리 로직 추가 가능
    // 예: await supabase.from("analysis_results").insert({ ...data })

    return NextResponse.json({ message: "JSON received successfully" })
  } catch (error) {
    console.error("❌ JSON 수신 에러:", error)
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
}
