// 📁 /lib/getUserApiKeyId.ts
import { createClient } from "@supabase/supabase-js"

/**
 * ✅ 현재 로그인한 사용자의 API 키 ID를 반환하는 함수
 * - supabase.auth.getUser() 로 현재 로그인 유저를 확인
 * - 해당 유저의 api_keys 테이블에서 id를 가져옴
 * - 여러 개 있을 경우 가장 최근 생성된 api_key 반환
 */
export async function getUserApiKeyId(): Promise<number | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    // 🔹 현재 로그인 유저 가져오기
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("❌ 유저 인증 실패:", userError?.message)
      return null
    }

    // 🔹 api_keys 테이블에서 해당 유저의 api_key id 조회
    const { data, error } = await supabase
      .from("api_keys")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error("❌ api_keys 조회 실패:", error.message)
      return null
    }

    if (!data?.id) {
      console.warn("⚠️ 해당 유저의 API 키가 존재하지 않습니다.")
      return null
    }

    // ✅ 성공적으로 id 반환
    return data.id
  } catch (err) {
    console.error("🚨 getUserApiKeyId 오류:", err)
    return null
  }
}
