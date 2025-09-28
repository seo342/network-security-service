import { Shield, Zap, Globe, BarChart3, Lock, AlertTriangle} from "lucide-react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// 개별 기능 카드 컴포넌트
function FeatureCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="border rounded-lg p-6 text-center hover:shadow-lg transition">
      {/* 아이콘 */}
      <div className="h-12 w-12 mx-auto mb-4 flex items-center justify-center bg-primary/10 rounded-lg">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      {/* 제목 */}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {/* 설명 */}
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  )
}

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">강력한 보안 기능</h2>
            <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
              최첨단 AI 기술로 네트워크 위협을 실시간으로 탐지하고 차단합니다.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>실시간 위협 탐지</CardTitle>
                <CardDescription>
                  AI 알고리즘이 네트워크 트래픽을 실시간으로 분석하여 의심스러운 활동을 즉시 감지합니다.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <AlertTriangle className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>DDoS 공격 방어</CardTitle>
                <CardDescription>
                  대규모 DDoS 공격을 자동으로 감지하고 차단하여 서비스 중단을 방지합니다.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-destructive/10 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-destructive" />
                </div>
                <CardTitle>외국 IP 차단</CardTitle>
                <CardDescription>
                  특정 국가의 IP 접속을 자동으로 차단하고 관리자에게 실시간 알림을 전송합니다.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-chart-4/10 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-chart-4" />
                </div>
                <CardTitle>상세 분석 리포트</CardTitle>
                <CardDescription>네트워크 트래픽과 보안 이벤트에 대한 상세한 분석 리포트를 제공합니다.</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-chart-5/10 rounded-lg flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6 text-chart-5" />
                </div>
                <CardTitle>API 키 관리</CardTitle>
                <CardDescription>간편한 API 키 발급과 관리로 웹사이트에 쉽게 통합할 수 있습니다.</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>즉시 알림</CardTitle>
                <CardDescription>
                  위협 감지 시 이메일, SMS 등 다양한 방법으로 즉시 알림을 받을 수 있습니다.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>
  )
}
