import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL! // ✅ URL은 통일
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // 서버 전용

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing env vars")
}

export const supabaseServerClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
})
