"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"

interface ApiKey {
  id: number
  name: string
  status: "active" | "inactive"
  created_at: string
  last_used: string | null
}

export default function APIKeyList() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(false)

  const fetchApiKeys = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("api_keys")
      .select("id, name, status, created_at, last_used")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (!error && data) setApiKeys(data)
  }

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const handleCreateApiKey = async () => {
    setLoading(true)
    try {
      // 1) 세션 가져오기
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert("로그인이 필요합니다.")
        return
      }

      // 2) 서버 API 호출 (토큰 포함)
      const res = await fetch("/api-management/generate-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      const { apiKey, error } = await res.json()
      if (error) throw new Error(error)

      // 3) 사용자에게 API 키 표시
      alert(`새 API 키가 발급되었습니다:\n${apiKey}\n\n※ 복사하지 않으면 다시 확인할 수 없습니다.`)
      fetchApiKeys()
    } catch (err: any) {
      alert("API 키 생성 실패: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleCreateApiKey} disabled={loading}>
          <Plus className="h-4 w-4 mr-2" />
          {loading ? "발급 중..." : "새 API 키 발급"}
        </Button>
      </div>

      <div className="grid gap-4">
        {apiKeys.map((apiKey) => (
          <Card key={apiKey.id} className="border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{apiKey.name}</CardTitle>
                  <CardDescription>
                    생성일: {new Date(apiKey.created_at).toLocaleString()} • 마지막 사용:{" "}
                    {apiKey.last_used ? new Date(apiKey.last_used).toLocaleString() : "없음"}
                  </CardDescription>
                </div>
                <Badge variant={apiKey.status === "active" ? "default" : "secondary"}>
                  {apiKey.status === "active" ? "활성" : "비활성"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label className="text-sm">API 키</Label>
                <div className="px-3 py-2 bg-muted rounded-md text-sm font-mono">
                  {"••••••••••••••••••••••••••"} {/* 실제 키는 DB에 없음 */}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
