"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Copy, Settings, Trash2 } from "lucide-react"

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

interface APIKeyListProps {
  apiKeys: ApiKey[]
}

export default function APIKeyList({ apiKeys }: APIKeyListProps) {
  const [showKeys, setShowKeys] = useState<{ [key: number]: boolean }>({})

  const toggleKeyVisibility = (id: number) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // TODO: toast 알림 추가 가능
  }

  return (
    <div className="grid gap-4">
      {apiKeys.map((apiKey) => (
        <Card key={apiKey.id} className="border-border/50">
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
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* API Key 표시 */}
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">API 키:</Label>
                <div className="flex items-center gap-2 flex-1">
                  <code className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-sm">
                    {showKeys[apiKey.id]
                      ? `sk_live_${apiKey.id}_abcd1234efgh5678ijkl9012mnop3456`
                      : apiKey.key}
                  </code>
                  <Button variant="ghost" size="sm" onClick={() => toggleKeyVisibility(apiKey.id)}>
                    {showKeys[apiKey.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        showKeys[apiKey.id]
                          ? `sk_live_${apiKey.id}_abcd1234efgh5678ijkl9012mnop3456`
                          : apiKey.key,
                      )
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* 세부 정보 */}
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
                  <div className="font-semibold">
                    {apiKey.status === "active" ? "정상 작동" : "비활성"}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
