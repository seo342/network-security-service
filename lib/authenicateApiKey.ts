// lib/authenticateApiKey.ts
import { supabaseAdmin } from "@/lib/supabaseServiceClient"
import { NextResponse } from "next/server"

export async function authenticateApiKey(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Missing Authorization header", status: 401 }
  }

  const rawKey = authHeader.split(" ")[1]

  // DB에서 키 검색
  const { data, error } = await supabaseAdmin
    .from("api_keys")
    .select("*")
    .eq("api_key", rawKey) // (나중에는 해시 비교로 변경 가능)
    .single()

  if (error || !data) {
    return { error: "Invalid API Key", status: 403 }
  }

  // last_used 업데이트
  await supabaseAdmin.from("api_keys").update({ last_used: new Date().toISOString() }).eq("id", data.id)

  return { key: data }
}
