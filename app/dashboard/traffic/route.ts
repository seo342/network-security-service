import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const API_KEY_SALT = process.env.API_KEY_SALT!

function hashKey(key: string) {
  return crypto.createHash("sha256").update(key + API_KEY_SALT).digest("hex")
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing API key" }, { status: 401 })
  }

  const userKey = authHeader.split(" ")[1]
  const hashed = hashKey(userKey)

  // DB에 저장된 key_hash 와 비교
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, user_id, status")
    .eq("key_hash", hashed)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 403 })
  }

  // TODO: 실제 트래픽 로그 불러오기
  const logs = [
    { timestamp: new Date().toISOString(), src_ip: "192.168.0.1", dst_ip: "8.8.8.8", protocol: "TCP", packet_size: 128 }
  ]

  return NextResponse.json(logs)
}
