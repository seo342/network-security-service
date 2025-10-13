"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import ApiKeyCreateDialog from "@/components/api/ApiKeyCreateDialog"
import { Loader2 } from "lucide-react" // 🆕 로딩 아이콘 추가

interface ApiKey {
  id: number
  name: string
  status: "active" | "inactive"
  created_at: string
  last_used: string | null
  api_key: string | null
  description: string
  site_url: string | null
}

export default function APIKeyList() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [visibleKeys, setVisibleKeys] = useState<Record<number, boolean>>({})
  const [revealedKeys, setRevealedKeys] = useState<Record<number, string>>({}) // 🆕 복원된 키 저장
  const [editingSite, setEditingSite] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(false)
  const [revealLoading, setRevealLoading] = useState<Record<number, boolean>>({}) // 🆕

  // 🔒 내부 API Route 호출 (DB에서 키 목록 가져오기)
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

  useEffect(() => {
    fetchApiKeys()
  }, [])

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
    } catch (err) {
      console.error("사이트 연결 실패:", err)
    }

    setEditingSite((prev) => {
      const newState = { ...prev }
      delete newState[id]
      return newState
    })
  }

  // ✅ 사이트 URL 삭제
  const handleDeleteSite = async (id: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch(`/api-management/keys/${id}/site`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (!res.ok) throw new Error("사이트 삭제 실패")
      await fetchApiKeys()
    } catch (err) {
      console.error("사이트 삭제 실패:", err)
    }

    setEditingSite((prev) => {
      const newState = { ...prev }
      delete newState[id]
      return newState
    })
  }

  // ✅ API 키 삭제
  const handleDeleteAPI = async (id: number) => {
    if (!confirm("정말 이 API 키를 삭제하시겠습니까?")) return
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch(`/api-management/keys/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })
      if (!res.ok) throw new Error("API 키 삭제 실패")
      await fetchApiKeys()
    } catch (err) {
      console.error("API 키 삭제 실패", err)
    } finally {
      setLoading(false)
    }
  }

  // 🆕 API 키 복원 함수
  const handleRevealKey = async (id: number) => {
    setRevealLoading((prev) => ({ ...prev, [id]: true }))
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch(`/api-management/keys/${id}/reveal`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (!res.ok) throw new Error("API 키 복원 실패")
      const data = await res.json()

      // 복원된 키 저장
      setRevealedKeys((prev) => ({ ...prev, [id]: data.apiKey }))
      setVisibleKeys((prev) => ({ ...prev, [id]: true }))
    } catch (err) {
      console.error("API 키 복원 실패:", err)
      alert("API 키 복원에 실패했습니다.")
    } finally {
      setRevealLoading((prev) => ({ ...prev, [id]: false }))
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

                {/* 🔒 복원 및 숨김 토글 */}
                <div className="flex items-center gap-2">
                  {visibleKeys[apiKey.id] ? (
                    <Badge
                      onClick={() =>
                        setVisibleKeys((prev) => ({ ...prev, [apiKey.id]: false }))
                      }
                      variant="secondary"
                      className="cursor-pointer"
                    >
                      숨기기
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRevealKey(apiKey.id)}
                      disabled={revealLoading[apiKey.id]}
                    >
                      {revealLoading[apiKey.id] ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          복원 중...
                        </>
                      ) : (
                        "API 키 보기"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {/* 복원된 키 표시 */}
                <div className="px-3 py-2 bg-muted rounded-md text-sm font-mono break-all">
                  {visibleKeys[apiKey.id]
                    ? revealedKeys[apiKey.id] || apiKey.api_key || "복원된 키 없음"
                    : "••••••••••••••••••"}
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
                    {apiKey.site_url ? "수정" : "연결"}
                  </Button>
                  {apiKey.site_url && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteSite(apiKey.id)}
                    >
                      삭제
                    </Button>
                  )}
                </div>

                {apiKey.site_url && (
                  <p className="text-xs text-muted-foreground">
                    🔗 현재 연결된 사이트: {apiKey.site_url}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
