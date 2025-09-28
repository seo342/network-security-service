"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Eye, EyeOff, Copy, Settings, Trash2 } from "lucide-react"
import { useState } from "react"

interface ApiKey {
  id: number
  name: string
  key: string
  created: string
  lastUsed: string
  requests: number
  status: "active" | "inactive"
  endpoint: string
}

interface ApiKeyCardProps {
  apiKey: ApiKey
}

export default function ApiKeyCard({ apiKey }: ApiKeyCardProps) {
  const [visible, setVisible] = useState(false)

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text)

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{apiKey.name}</CardTitle>
            <CardDescription>
              생성일: {apiKey.created} • 마지막 사용: {apiKey.lastUsed}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={apiKey.status === "active" ? "default" : "secondary"}>
              {apiKey.status === "active" ? "활성" : "비활성"}
            </Badge>
            <Button variant="ghost" size="sm"><Settings className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm"><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">API 키:</span>
            <div className="flex items-center gap-2 flex-1">
              <code className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-sm">
                {visible ? `sk_live_${apiKey.id}_abcd1234efgh5678` : apiKey.key}
              </code>
              <Button variant="ghost" size="sm" onClick={() => setVisible(!visible)}>
                {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(apiKey.key)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">엔드포인트:</span>
              <div className="font-mono">{apiKey.endpoint}</div>
            </div>
            <div>
              <span className="text-muted-foreground">총 요청 수:</span>
              <div className="font-semibold">{apiKey.requests.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-muted-foreground">상태:</span>
              <div className="font-semibold">{apiKey.status === "active" ? "정상 작동" : "비활성"}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
