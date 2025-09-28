"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function Settings() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>외국 IP 차단 설정</CardTitle>
          <CardDescription>특정 국가의 IP 접속을 자동으로 차단합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">북한 IP 차단</span>
              <Badge variant="destructive">활성</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">중국 IP 차단</span>
              <Badge variant="secondary">비활성</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">러시아 IP 차단</span>
              <Badge variant="secondary">비활성</Badge>
            </div>
            <Button className="w-full">설정 변경</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>알림 설정</CardTitle>
          <CardDescription>위협 탐지 시 알림 방법을 설정합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">이메일 알림</span>
              <Badge variant="default">활성</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">SMS 알림</span>
              <Badge variant="secondary">비활성</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">웹훅 알림</span>
              <Badge variant="default">활성</Badge>
            </div>
            <Button className="w-full">알림 설정</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
