
"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Key, ShieldCheck, Clock } from "lucide-react"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ApiKey {
  id: string
  name: string
  created_at: string
  status: string
  description: string
  last_used: string
}

export default function ApiKeysPage() {
  const router = useRouter()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadKeys = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error("로그인이 필요합니다.")

        const { data, error } = await supabase
          .from("api_keys")
          .select("id,name,created_at,status,description,last_used")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) throw error
        setApiKeys(data || [])
      } catch (err) {
        console.error("❌ API 키 불러오기 실패:", err)
      } finally {
        setLoading(false)
      }
    }
    loadKeys()
  }, [])

  if (loading) return <p className="text-center py-10">🔄 불러오는 중...</p>

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <h2 className="text-xl font-semibold mb-6">🔑 내 API 키 목록</h2>

      {apiKeys.length === 0 ? (
        <p className="text-muted-foreground text-center">등록된 API 키가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apiKeys.map((key) => (
            <Card
              key={key.id}
              onClick={() => router.push(`/dashboard/${key.id}`)} // ✅ [id] 경로로 이동
              className="hover:shadow-md transition cursor-pointer hover:bg-accent/10"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Key className="h-4 w-4 text-primary" /> {key.name}
                </CardTitle>
                <span className="text-sm font-semibold">
                  {key.status.toUpperCase()}
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> {key.description || "일반 API 키"}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />{" "}
                  {new Date(key.created_at).toLocaleDateString("ko-KR")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
