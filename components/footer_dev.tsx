import Link from "next/link"
import { Shield } from "lucide-react"

// Footer 컴포넌트: 페이지 하단 바
// - 로고 및 서비스명
// - 주요 링크(개인정보처리방침, 이용약관, 고객지원)
// - 저작권 문구
export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-bold text-foreground">SecureNet AI</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="text-muted-foreground">개인정보처리방침</span>
              <span className="text-muted-foreground">이용약관</span>
              <span className="text-muted-foreground">고객지원</span>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © 2025 SecureNet AI. All rights reserved.
          </div>
        </div>
      </footer>
  )
}
