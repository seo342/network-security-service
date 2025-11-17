import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function ArchitectureSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">서비스 아키텍처</h2>
          <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
            복잡한 설정 없이 몇 분 만에 네트워크 보안을 강화하세요.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">

            <Card className="flex-1 text-center min-h-[180px] flex flex-col justify-center">
              <CardHeader>
                <CardTitle className="text-lg">사용자PC & 데이터 분석기</CardTitle>
                <CardDescription>실시간 트래픽 집계</CardDescription>
              </CardHeader>
            </Card>

            <div className="text-primary text-2xl">→</div>

            <Card className="flex-1 text-center min-h-[180px] flex flex-col justify-center">
              <CardHeader>
                <CardTitle className="text-lg">AI 분석 서버 (XGBoost)</CardTitle>
                <CardDescription>보안 API 인증 및 위협 탐지</CardDescription>
              </CardHeader>
            </Card>

            <div className="text-primary text-2xl">→</div>

            <Card className="flex-1 text-center min-h-[180px] flex flex-col justify-center">
              <CardHeader>
                <CardTitle className="text-lg">웹 서비스 플랫폼</CardTitle>
                <CardDescription>대시보드 시각화 (그래프/통계)</CardDescription>
              </CardHeader>
            </Card>

            <div className="text-primary text-2xl">→</div>

            <Card className="flex-1 text-center min-h-[180px] flex flex-col justify-center">
              <CardHeader>
                <CardTitle className="text-lg">사용자(관리자)</CardTitle>
                <CardDescription>실시간 이메일 알림 수신</CardDescription>
              </CardHeader>
            </Card>

          </div>
        </div>
      </div>
    </section>
  )
}
