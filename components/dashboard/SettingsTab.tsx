"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Settings({ apiKeyId }: { apiKeyId: string }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [emailAlert, setEmailAlert] = useState<boolean>(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [apiStatus, setApiStatus] = useState<string>("active") // ✅ API 키 상태 저장

  // ✅ 로그인 유저 및 설정 불러오기
  useEffect(() => {
    const loadUser = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (error || !data.user) return
      setUserId(data.user.id)
      await Promise.all([loadSettings(data.user.id), loadApiKeyStatus()])
    }
    loadUser()
  }, [apiKeyId])

  // ✅ 알림 설정 불러오기
  const loadSettings = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from("notification_settings")
        .select("email_alert")
        .eq("user_id", uid)
        .maybeSingle()

      if (error) throw error
      if (data) {
        setEmailAlert(data.email_alert)
      } else {
        // 새 레코드 없으면 기본값 생성
        await supabase.from("notification_settings").insert({ user_id: uid })
      }
    } catch (err) {
      console.error("❌ 설정 불러오기 실패:", err)
    } finally {
      setLoading(false)
    }
  }

  // ✅ API 키 상태 불러오기
  const loadApiKeyStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("api_keys")
        .select("status")
        .eq("id", apiKeyId)
        .single()
      if (error) throw error
      setApiStatus(data.status)
    } catch (err) {
      console.error("❌ API 상태 불러오기 실패:", err)
    }
  }

  // ✅ 이메일 알림 토글
  const toggleEmailAlert = async () => {
    if (!userId) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from("notification_settings")
        .update({
          email_alert: !emailAlert,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
      if (error) throw error
      setEmailAlert(!emailAlert)
    } catch (err) {
      console.error("❌ 이메일 알림 변경 실패:", err)
    } finally {
      setSaving(false)
    }
  }

  // ✅ API 키 상태 토글
  const toggleApiStatus = async () => {
    setSaving(true)
    try {
      const newStatus = apiStatus === "active" ? "inactive" : "active"
      const { error } = await supabase
        .from("api_keys")
        .update({ status: newStatus })
        .eq("id", apiKeyId)
      if (error) throw error
      setApiStatus(newStatus)
    } catch (err) {
      console.error("❌ API 키 상태 변경 실패:", err)
    } finally {
      setSaving(false)
    }
  }

  if (loading)
    return <p className="text-center text-muted-foreground py-6">🔄 설정 불러오는 중...</p>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 이메일 알림 */}
      <Card>
        <CardHeader>
          <CardTitle>이메일 알림</CardTitle>
          <CardDescription>위협 탐지 시 이메일로 알림을 받습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm">현재 상태</span>
            <Badge variant={emailAlert ? "default" : "secondary"}>
              {emailAlert ? "활성" : "비활성"}
            </Badge>
          </div>
          <Button
            className="w-full"
            disabled={saving}
            onClick={toggleEmailAlert}
          >
            {saving ? "변경 중..." : emailAlert ? "이메일 알림 끄기" : "이메일 알림 켜기"}
          </Button>
        </CardContent>
      </Card>

      {/* ✅ API 일시 정지 */}
      <Card>
        <CardHeader>
          <CardTitle>API 키 일시 정지</CardTitle>
          <CardDescription>
            일시 정지 시 이 API 키로 요청이 불가능합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm">현재 상태</span>
            <Badge variant={apiStatus === "active" ? "default" : "secondary"}>
              {apiStatus === "active" ? "활성" : "정지됨"}
            </Badge>
          </div>
          <Button
            className="w-full"
            disabled={saving}
            onClick={toggleApiStatus}
          >
            {saving
              ? "변경 중..."
              : apiStatus === "active"
              ? "API 키 정지하기"
              : "API 키 다시 활성화"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
