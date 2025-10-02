import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 🔹 site_url 등록 또는 수정
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const keyId = parseInt(params.id, 10)
    const { site_url } = await req.json()

    if (!site_url || isNaN(keyId)) {
      return NextResponse.json({ error: "잘못된 요청" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("api_keys")
      .update({ site_url })
      .eq("id", keyId)
      .select()

    if (error) throw error

    return NextResponse.json({ ok: true, data })
  } catch (e: any) {
    return NextResponse.json({ error: "사이트 저장 실패", details: e.message }, { status: 500 })
  }
}

// 🔹 site_url 삭제
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const keyId = parseInt(params.id, 10)
    if (isNaN(keyId)) {
      return NextResponse.json({ error: "잘못된 요청" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("api_keys")
      .update({ site_url: null })
      .eq("id", keyId)
      .select()

    if (error) throw error

    return NextResponse.json({ ok: true, data })
  } catch (e: any) {
    return NextResponse.json({ error: "사이트 삭제 실패", details: e.message }, { status: 500 })
  }
}

// 🔹 site_url 테스트 (실제 호출)
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const keyId = parseInt(params.id, 10)
    if (isNaN(keyId)) {
      return NextResponse.json({ error: "잘못된 요청" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("api_keys")
      .select("api_key, site_url")
      .eq("id", keyId)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: "API 키/사이트 정보를 찾을 수 없음" }, { status: 404 })
    }

    const { api_key, site_url } = data
    if (!site_url) {
      return NextResponse.json({ error: "사이트 URL이 등록되지 않음" }, { status: 400 })
    }

    // 실제 API 테스트 요청
    const res = await fetch(site_url, {
      headers: { Authorization: `Bearer ${api_key}` },
    })

    if (!res.ok) {
      return NextResponse.json({ error: `요청 실패 (HTTP ${res.status})` }, { status: res.status })
    }

    return NextResponse.json({ ok: true, message: "API 키 작동 확인됨" })
  } catch (e: any) {
    return NextResponse.json({ error: "사이트 테스트 실패", details: e.message }, { status: 500 })
  }
}
