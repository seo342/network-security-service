"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import APIKeyList from "@/components/api/ApiKeyList_temp"
import ApiDocs from "@/components/api/ApiDocs"

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

export default function ApiManagementPage() {
  return (
    <div className="min-h-screen bg-background">

      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-2">API 관리</h1>
        <p className="text-muted-foreground mb-6">
          SecureNet AI API 키를 생성하고 관리하여 웹사이트에 보안 모니터링을 통합하세요.
        </p>
            <APIKeyList />
      </div>
    </div>
  )
}
