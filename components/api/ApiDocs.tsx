"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Shield, Globe, BarChart3 } from "lucide-react"

const codeExamples = {
  javascript: `// JavaScript/Node.js 예제
const response = await fetch('https://api.securenet.ai/v1/monitor', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ ip: '192.168.1.1', user_agent: 'Mozilla/5.0...', timestamp: Date.now() })
});

const result = await response.json();
console.log(result);`,

  python: `# Python 예제
import requests

url = "https://api.securenet.ai/v1/monitor"
headers = { "Authorization": "Bearer YOUR_API_KEY", "Content-Type": "application/json" }
data = { "ip": "192.168.1.1", "user_agent": "Mozilla/5.0...", "timestamp": 1640995200 }

response = requests.post(url, headers=headers, json=data)
print(response.json())`,

  curl: `# cURL 예제
curl -X POST https://api.securenet.ai/v1/monitor \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "ip": "192.168.1.1", "user_agent": "Mozilla/5.0...", "timestamp": 1640995200 }'`,
}

export default function ApiDocs() {
  const [selectedLanguage, setSelectedLanguage] = useState<"javascript" | "python" | "curl">("javascript")

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text)

  return (
    <div className="space-y-6">
      {/* 빠른 시작 가이드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>빠른 시작 가이드</CardTitle>
            <CardDescription>SecureNet AI API를 웹사이트에 통합하는 방법</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold">1. API 키 획득</h4>
              <p className="text-sm text-muted-foreground">"API 키" 탭에서 새 키를 생성하세요.</p>
            </div>
            <div>
              <h4 className="font-semibold">2. 패키지 설치</h4>
              <code className="block p-2 bg-muted rounded text-sm">npm install @securenet/monitoring</code>
            </div>
            <div>
              <h4 className="font-semibold">3. 초기화</h4>
              <p className="text-sm text-muted-foreground">웹사이트에 모니터링 코드를 추가해 실시간 보안 감시를 시작하세요.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>주요 기능</CardTitle>
            <CardDescription>SecureNet AI API 보안 기능</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">실시간 위협 탐지</div>
                <div className="text-sm text-muted-foreground">AI 기반 보안 위협 감지</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-accent" />
              <div>
                <div className="font-medium">지역별 IP 차단</div>
                <div className="text-sm text-muted-foreground">특정 국가/지역 IP 자동 차단</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-chart-4" />
              <div>
                <div className="font-medium">상세 분석 리포트</div>
                <div className="text-sm text-muted-foreground">트래픽/보안 이벤트 분석</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 코드 예제 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>코드 예제</CardTitle>
              <CardDescription>다양한 언어로 API 사용하기</CardDescription>
            </div>
            <div className="flex gap-2">
              {(["javascript", "python", "curl"] as const).map((lang) => (
                <Button
                  key={lang}
                  variant={selectedLanguage === lang ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedLanguage(lang)}
                >
                  {lang.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
              <code>{codeExamples[selectedLanguage]}</code>
            </pre>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => copyToClipboard(codeExamples[selectedLanguage])}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
