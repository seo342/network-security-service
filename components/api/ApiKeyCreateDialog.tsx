"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

interface ApiKeyCreateDialogProps {
  onCreate: () => void // 부모에서 새로고침(fetchApiKeys)만 실행하면 되므로 단순화
}

interface ApiKey {
  id: number
  name: string
  status: "active" | "inactive"
  created_at: string
  last_used: string | null
  api_key: string | null
  description: string | null
}

export default function ApiKeyCreateDialog({ onCreate }: ApiKeyCreateDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)

  const handleCreateApiKey = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert("로그인이 필요합니다.")
        return
      }

      // name + description 같이 보냄
      const res = await fetch("/api-management/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name,
          description,
        }),
      })

      const result = await res.json()
      if (result.error) throw new Error(result.error)

      // 부모에서 목록 새로고침
      onCreate()

      // 입력값 초기화
      setOpen(false)
      setName("")
      setDescription("")
    } catch (err: any) {
      alert("API 키 생성 실패: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> 새 API 키 생성
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 API 키 생성</DialogTitle>
          <DialogDescription>새로운 API 키를 생성하세요.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="keyName">키 이름</Label>
            <Input
              id="keyName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: Production API Key"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="keyDescription">설명</Label>
            <Textarea
              id="keyDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="이 API 키의 용도를 설명해주세요"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button onClick={handleCreateApiKey} disabled={!name.trim() || loading}>
              {loading ? "생성중..." : "생성"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
