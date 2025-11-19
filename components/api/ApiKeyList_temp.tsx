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
import ApiKeyCreateDialog from "@/components/api/ApiKeyCreateDialog"
import { Loader2, Trash2, KeyRound } from "lucide-react"

interface ApiKey {
  id: number
  name: string
  status: "active" | "inactive"
  auth_key: string | null
  created_at: string
  last_used: string | null
  api_key: string | null
  description: string
  site_url: string | null
}

export default function APIKeyList() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [visibleKeys, setVisibleKeys] = useState<Record<number, boolean>>({})
  const [visibleAuthKeys, setVisibleAuthKeys] = useState<Record<number, boolean>>({})
  const [revealedKeys, setRevealedKeys] = useState<Record<number, string>>({})
  const [revealedAuthKeys, setRevealedAuthKeys] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(false)
  const [revealLoading, setRevealLoading] = useState<Record<number, boolean>>({})
  const [revealAuthLoading, setRevealAuthLoading] = useState<Record<number, boolean>>({})

  // 🔹 API 키 목록 불러오기
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

  // 🗑️ API 키 삭제
  const handleDeleteAPI = async (id: number) => {
    if (!confirm("정말 이 API 키를 삭제하시겠습니까?\n관련된 로그와 데이터도 함께 삭제됩니다.")) return
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
      console.error("API 키 삭제 실패:", err)
      alert("API 키 삭제 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  // 🔐 API 키 복원
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

      setRevealedKeys((prev) => ({ ...prev, [id]: data.apiKey }))
      setVisibleKeys((prev) => ({ ...prev, [id]: true }))
    } catch (err) {
      console.error("API 키 복원 실패:", err)
      alert("API 키 복원에 실패했습니다.")
    } finally {
      setRevealLoading((prev) => ({ ...prev, [id]: false }))
    }
  }

  // 🔑 Auth 키 복원
  const handleRevealAuthKey = async (id: number) => {
    setRevealAuthLoading((prev) => ({ ...prev, [id]: true }))
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch(`/api-management/keys/${id}/reveal_auth`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (!res.ok) throw new Error("Auth 키 복원 실패")
      const data = await res.json()

      setRevealedAuthKeys((prev) => ({ ...prev, [id]: data.authKey }))
      setVisibleAuthKeys((prev) => ({ ...prev, [id]: true }))
    } catch (err) {
      console.error("Auth 키 복원 실패:", err)
      alert("Auth 키 복원에 실패했습니다.")
    } finally {
      setRevealAuthLoading((prev) => ({ ...prev, [id]: false }))
    }
  }

  return (
    <div className="space-y-6">
      {/* 🔹 API 키 생성 버튼 */}
      <div className="flex justify-end">
        <ApiKeyCreateDialog onCreate={fetchApiKeys} />
      </div>

      {/* 🔹 API 키 목록 */}
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

                {/* 🔒 복원 및 삭제 버튼들 */}
                <div className="flex items-center gap-2">
                  {/* API 키 보기 버튼 */}
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

                  {/* Auth 키 보기 버튼 */}
                  {visibleAuthKeys[apiKey.id] ? (
                    <Badge
                      onClick={() =>
                        setVisibleAuthKeys((prev) => ({ ...prev, [apiKey.id]: false }))
                      }
                      variant="outline"
                      className="cursor-pointer"
                    >
                      숨기기
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRevealAuthKey(apiKey.id)}
                      disabled={revealAuthLoading[apiKey.id]}
                    >
                      {revealAuthLoading[apiKey.id] ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          복원 중...
                        </>
                      ) : (
                        <>
                          <KeyRound className="h-4 w-4 mr-1" />
                          Auth 키 보기
                        </>
                      )}
                    </Button>
                  )}

                  {/* 🗑️ 삭제 버튼 */}
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => handleDeleteAPI(apiKey.id)}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {/* API 키 표시 */}
                <div className="px-3 py-2 bg-muted rounded-md text-sm font-mono break-all">
                  {visibleKeys[apiKey.id]
                    ? revealedKeys[apiKey.id] || apiKey.api_key || "복원된 키 없음"
                    : "••••••••••••••••••"}
                </div>

                {/* Auth 키 표시 */}
                <div className="px-3 py-2 bg-muted rounded-md text-sm font-mono break-all">
                  {visibleAuthKeys[apiKey.id]
                    ? revealedAuthKeys[apiKey.id] || apiKey.auth_key || "복원된 키 없음"
                    : "••••••••••••••••••"}
                </div>

                <Label className="text-sm">{apiKey.description}</Label>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
