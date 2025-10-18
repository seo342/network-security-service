"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Settings() {
  const [emailAlert, setEmailAlert] = useState<boolean>(true)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // 🔹 로그인한 유저 ID 불러오기
  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (!error && data.user) {
        setUserId(data.user.id)
        loadNotificationSetting(data.user.id)
      }
    }
    getUser()
  }, [])

  // 🔹 현재 설정 불러오기
  const loadNotificationSetting = async (uid: string) => {
    try {
      const res = await fetch(`/dashboard/setting/notification?user_id=${uid}`)
      if (!res.ok) throw new Error("HTTP error " + res.status)
      const json = await res.json()
      if (json.success && json.data) setEmailAlert(json.data.email_alert)
    } catch (err) {
      console.error("❌ 알림 설정 불러오기 실패:", err)
    }
  }

  // 🔹 설정 토글
  const toggleEmailAlert = async () => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await fetch("/dashboard/setting/notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          email_alert: !emailAlert,
        }),
      })
      if (!res.ok) throw new Error("HTTP error " + res.status)
      const json = await res.json()
      if (json.success) setEmailAlert(!emailAlert)
    } catch (err) {
      console.error("❌ 알림 설정 저장 실패:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 외국 IP 차단 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>외국 IP 차단 설정</CardTitle>
          <CardDescription>특정 국가의 IP 접속을 자동으로 차단합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">북한 IP 차단</span>
              <Badge variant="destructive">활성</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">중국 IP 차단</span>
              <Badge variant="secondary">비활성</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">러시아 IP 차단</span>
              <Badge variant="secondary">비활성</Badge>
            </div>
            <Button className="w-full">설정 변경</Button>
          </div>
        </CardContent>
      </Card>

      {/* 알림 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>알림 설정</CardTitle>
          <CardDescription>위협 탐지 시 이메일로 알림을 받습니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">이메일 알림</span>
              <Badge variant={emailAlert ? "default" : "secondary"}>
                {emailAlert ? "활성" : "비활성"}
              </Badge>
            </div>
            <Button
              className="w-full"
              onClick={toggleEmailAlert}
              disabled={loading}
            >
              {loading ? "변경 중..." : "알림 설정 변경"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
