"use client"

import { useState } from "react"
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

interface ApiKeyCreateDialogProps {
  onCreate: (name: string, description?: string) => void
}

export default function ApiKeyCreateDialog({ onCreate }: ApiKeyCreateDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  const handleCreate = () => {
    onCreate(name, description)
    setOpen(false)
    setName("")
    setDescription("")
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
            <Button variant="outline" onClick={() => setOpen(false)}>취소</Button>
            <Button onClick={handleCreate} disabled={!name.trim()}>생성</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
