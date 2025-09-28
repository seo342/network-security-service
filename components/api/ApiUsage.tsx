"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { BarChart3, Shield, Calendar, Download } from "lucide-react"

interface ApiKey {
  id: number
  name: string
  key: string
  requests: number
}

interface ApiUsageProps {
  apiKeys: ApiKey[]
}

export default function ApiUsage({ apiKeys }: ApiUsageProps) {
  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">이번 달 요청</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18,650</div>
            <p className="text-xs text-muted-foreground">+12% 지난 달 대비</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">위협 차단</CardTitle>
            <Shield className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">127</div>
            <p className="text-xs text-muted-foreground">이번 달 총 차단 수</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">응답 시간</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45ms</div>
            <p className="text-xs text-muted-foreground">평균 API 응답 시간</p>
          </CardContent>
        </Card>
      </div>

      {/* API 키별 사용량 */}
      <Card>
        <CardHeader>
          <CardTitle>API 키별 사용량</CardTitle>
          <CardDescription>각 API 키의 월별 사용량</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {apiKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                className="flex items-center justify-between p-4 border border-border/50 rounded-lg"
              >
                <div>
                  <div className="font-medium">{apiKey.name}</div>
                  <div className="text-sm text-muted-foreground">{apiKey.key}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{apiKey.requests.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">요청</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 사용량 리포트 */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>사용량 리포트</CardTitle>
            <CardDescription>상세한 분석 리포트를 다운로드</CardDescription>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            리포트 다운로드
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>리포트 기간</Label>
              <select className="w-full p-2 border border-border rounded-md bg-background">
                <option>지난 7일</option>
                <option>지난 30일</option>
                <option>지난 3개월</option>
                <option>지난 1년</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>리포트 형식</Label>
              <select className="w-full p-2 border border-border rounded-md bg-background">
                <option>CSV</option>
                <option>JSON</option>
                <option>PDF</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
