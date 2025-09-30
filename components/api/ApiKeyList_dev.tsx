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
  api_key: string | null // 원문 키 저장
}

export default function APIKeyList() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(false)
  const [visibleKeys, setVisibleKeys] = useState<Record<number, boolean>>({})

  const fetchApiKeys = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("api_keys")
      .select("id, name, status, created_at, last_used, api_key") // 원문 포함
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
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert("로그인이 필요합니다.")
        return
      }

      const res = await fetch("/api-management/generate-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      })
      const result=await res.json()
      if (result.error) throw new Error(result.error)
        
      // 발급 직후에는 alert 없음
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
                <Badge
                  onClick={() =>
                    setVisibleKeys((prev) => ({
                      ...prev,
                      [apiKey.id]: !prev[apiKey.id],
                    }))
                  }
                  className="cursor-pointer"
                  variant={visibleKeys[apiKey.id] ? "default" : "secondary"}
                >
                  {visibleKeys[apiKey.id] ? "활성(표시중)" : "활성"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label className="text-sm">API 키</Label>
                <div className="px-3 py-2 bg-muted rounded-md text-sm font-mono">
                  {visibleKeys[apiKey.id]
                    ? apiKey.api_key || "키 없음"
                    : "••••••••••••••••••••••••"}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
