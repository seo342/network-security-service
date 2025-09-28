"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/router"
// Navigation 컴포넌트: 상단 네비게이션 바
// - 로고 클릭 → 홈으로 이동
// - 메뉴 링크 (홈, 분석, API 관리)
// - 로그인 여부에 따라 버튼 전환 (로그인/회원가입 vs 내 대시보드)
export function Navigation() {
  // TODO: 실제 로그인 상태(Supabase Auth)와 연동 필요
  const [isLoggedIn] = useState(false)

  return (
    <header className="w-full bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* 로고 */}
        <Link href="/" className="text-xl font-bold text-primary">
          SecureNet AI
        </Link>

        {/* 네비게이션 메뉴 */}
        <nav className="flex gap-6 items-center">
          {/* 상단 메뉴 */}
          <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
            홈
          </Link>
          <Link href="/analytics" className="text-sm font-medium hover:text-primary transition-colors">
            분석
          </Link>
          <Link href="/api-management" className="text-sm font-medium hover:text-primary transition-colors">
            API 관리
          </Link>

          {/* 로그인 여부에 따라 버튼 다르게 표시 */}
          {isLoggedIn ? (
            // 로그인 된 경우 → 대시보드 버튼
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-md bg-primary text-white text-sm font-semibold hover:bg-primary/90"
            >
              내 대시보드
            </Link>
          ) : (
            // 로그인 안 된 경우 → 로그인/회원가입 버튼
            <>
              <Link
                href="/login"
                className="px-4 py-2 rounded-md bg-primary text-white text-sm font-semibold hover:bg-primary/90"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 rounded-md border border-input text-sm font-semibold hover:bg-muted"
              >
                회원가입
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
