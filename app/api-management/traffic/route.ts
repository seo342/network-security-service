// app/api/traffic/route.ts
//버셀님 진짜로 테스트용이니까 한번만 눈감아 주세요 ㅠㅠㅠ
import { NextRequest, NextResponse } from "next/server";
import zlib from "zlib";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.API_KEY}`) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  try {
    // Request body를 ArrayBuffer로 읽기
    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // gzip 해제
    const decompressed = zlib.gunzipSync(buffer);
    const data = JSON.parse(decompressed.toString());

    console.log("📦 Received:", data);

    // TODO: Supabase DB에 저장하거나 로그 처리
    return NextResponse.json({ ok: true, received: data });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Invalid payload", detail: e.message },
      { status: 400 }
    );
  }
}
