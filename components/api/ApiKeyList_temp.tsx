"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import ApiKeyCreateDialog from "@/components/api/ApiKeyCreateDialog"

interface ApiKey {
  id: number
  name: string
  status: "active" | "inactive"
  created_at: string
  last_used: string | null
  api_key: string | null
  description: string
  site_url: string | null   // ✅ 사이트 연결
}

export default function APIKeyList() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [visibleKeys, setVisibleKeys] = useState<Record<number, boolean>>({})
  const [testResult, setTestResult] = useState<Record<number, string>>({})
  const [editingSite, setEditingSite] = useState<Record<number, string>>({})

  // 🔒 내부 API Route 호출
  const fetchApiKeys = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch("/api-management/keys", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) throw new Error("API 호출 실패")
      const data = await res.json()
      setApiKeys(data)
    } catch (err) {
      console.error("API 키 불러오기 실패:", err)
    }
  }

  useEffect(() => { fetchApiKeys() }, [])

  // ✅ 사이트 연결 저장
  const handleSaveSite = async (id: number) => {
    const site_url = editingSite[id]
    if (!site_url) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch(`/api-management/keys/${id}/site`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ site_url }),
      })

      if (!res.ok) throw new Error("사이트 연결 실패")
      await fetchApiKeys()
      setEditingSite((prev) => ({ ...prev, [id]: "" }))
    } catch (err) {
      console.error("사이트 연결 실패:", err)
    }
  }

  // ✅ API 키 테스트
  const handleTestApiKey = async (apiKey: string | null, id: number) => {
    if (!apiKey) {
      setTestResult((prev) => ({ ...prev, [id]: "❌ 키가 없음" }))
      return
    }

    try {
      const res = await fetch("/api-management/test-juice", {
        headers: { Authorization: `Bearer ${apiKey}` },
      })

      if (!res.ok) {
        setTestResult((prev) => ({ ...prev, [id]: `❌ 실패 (HTTP ${res.status})` }))
        return
      }

      const data = await res.json()
      setTestResult((prev) => ({ ...prev, [id]: `✅ 성공 (${data.message || "연결 확인"})` }))
    } catch (err: any) {
      setTestResult((prev) => ({ ...prev, [id]: "❌ 오류: " + err.message }))
    }
  }

  return (
    <div className="space-y-6">
      {/* API 키 생성 버튼 */}
      <div className="flex justify-end">
        <ApiKeyCreateDialog onCreate={fetchApiKeys} />
      </div>

      {/* API 키 목록 */}
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
                    setVisibleKeys((prev) => ({ ...prev, [apiKey.id]: !prev[apiKey.id] }))
                  }
                  className="cursor-pointer"
                  variant={visibleKeys[apiKey.id] ? "default" : "secondary"}
                >
                  {visibleKeys[apiKey.id] ? "표시중" : "숨김"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {/* 키 표시 */}
                <div className="px-3 py-2 bg-muted rounded-md text-sm font-mono">
                  {visibleKeys[apiKey.id] ? apiKey.api_key || "키 없음" : "••••••••••••••••••"}
                </div>

                <Label className="text-sm">{apiKey.description}</Label>

                {/* 🔗 사이트 연결 */}
                <div className="flex gap-2 items-center">
                  <Input
                    placeholder="사이트 URL 입력"
                    value={editingSite[apiKey.id] ?? apiKey.site_url ?? ""}
                    onChange={(e) =>
                      setEditingSite((prev) => ({ ...prev, [apiKey.id]: e.target.value }))
                    }
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSaveSite(apiKey.id)}
                  >
                    연결
                  </Button>
                </div>
                {apiKey.site_url && (
                  <p className="text-xs text-muted-foreground">🔗 연결된 사이트: {apiKey.site_url}</p>
                )}

                {/* API 연결 테스트 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestApiKey(apiKey.api_key, apiKey.id)}
                >
                  연결 테스트
                </Button>

                {/* 결과 표시 */}
                {testResult[apiKey.id] && (
                  <p className="text-xs mt-2 text-muted-foreground">{testResult[apiKey.id]}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
