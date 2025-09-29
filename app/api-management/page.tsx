"use client"

import { Navigation } from "@/components/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import APIKeyList from "@/components/api/ApiKeyList_dev"
import ApiDocs from "@/components/api/ApiDocs"
import ApiUsage from "@/components/api/ApiUsage"

interface ApiKey {
  id: number
  name: string
  key: string
  created: string
  lastUsed: any
  requests: number
  status: "active" | "inactive"
  endpoint: string
}

// Mock 데이터 (실제로는 서버에서 불러오기)
const mockApiKeys: ApiKey[]= [
  {
    id: 1,
    name: "Production API Key",
    key: "sk_live_krqwokk...",
    created: "2025/9/27",
    lastUsed: "2시간 전",
    requests: 15420,
    status: "active",
    endpoint: "https://api.securenet.ai/v1",
  },
  {
    id: 2,
    name: "Development API Key",
    key: "sk_test_abc123...",
    created: "2025/9/20",
    lastUsed: "1일 전",
    requests: 2340,
    status: "active",
    endpoint: "https://api.securenet.ai/v1",
  },
] as const

export default function ApiManagementPage() {
  return (
    <div className="min-h-screen bg-background">

      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-2">API 관리</h1>
        <p className="text-muted-foreground mb-6">
          SecureNet AI API 키를 생성하고 관리하여 웹사이트에 보안 모니터링을 통합하세요.
        </p>

        <Tabs defaultValue="keys" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="keys">API 키</TabsTrigger>
            <TabsTrigger value="docs">문서</TabsTrigger>
            <TabsTrigger value="usage">사용량</TabsTrigger>
          </TabsList>

          <TabsContent value="keys">
            <APIKeyList />
          </TabsContent>

          <TabsContent value="docs">
            <ApiDocs />
          </TabsContent>

          <TabsContent value="usage">
            <ApiUsage apiKeys={mockApiKeys} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
