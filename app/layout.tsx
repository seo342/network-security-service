import "./globals.css"
import { ReactNode } from "react"

// Header 대신 Navigation 불러오기
import { Navigation } from "@/components/navigation"

// Footer는 소문자로 만들었으니 맞게 import
import { Footer } from "@/components/footer_dev"

export const metadata = {
  title: "API Dashboard",
  description: "API 트래픽/보안 모니터링 서비스",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className="flex flex-col min-h-screen">
        {/* 상단 네비게이션 */}
        <Navigation />
        {/* 메인 컨텐츠 */}
        <main className="flex-1 container mx-auto px-4 py-6">
          {children}
        </main>
        {/* 하단 푸터 */}
        <Footer />
      </body>
    </html>
  )
}
