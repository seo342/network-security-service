import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function ArchitectureSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">간단한 아키텍처</h2>
            <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
              복잡한 설정 없이 몇 분 만에 네트워크 보안을 강화하세요.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <Card className="flex-1 text-center">
                <CardHeader>
                  <CardTitle className="text-lg">사용자 웹사이트</CardTitle>
                  <CardDescription>API 통합</CardDescription>
                </CardHeader>
              </Card>

              <div className="text-primary text-2xl">→</div>

              <Card className="flex-1 text-center">
                <CardHeader>
                  <CardTitle className="text-lg">데이터 수집 API</CardTitle>
                  <CardDescription>실시간 모니터링</CardDescription>
                </CardHeader>
              </Card>

              <div className="text-primary text-2xl">→</div>

              <Card className="flex-1 text-center">
                <CardHeader>
                  <CardTitle className="text-lg">AI 분석 엔진</CardTitle>
                  <CardDescription>위협 탐지</CardDescription>
                </CardHeader>
              </Card>

              <div className="text-primary text-2xl">→</div>

              <Card className="flex-1 text-center">
                <CardHeader>
                  <CardTitle className="text-lg">대시보드 & 알림</CardTitle>
                  <CardDescription>실시간 관리</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
    </section>
  )
}
