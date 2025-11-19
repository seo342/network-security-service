"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

export function Navigation() {
  const [session, setSession] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  // 로그아웃 핸들러
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("로그아웃 실패:", error.message)
    } else {
      setSession(null)
      router.push("/login")     // 🔥 로그아웃 즉시 로그인 페이지로 이동
      router.refresh()          // 세션 새로고침 (선택)
    }
  }

  return (
    <header className="w-full bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-primary">
          SecureNet AI
        </Link>

        <nav className="flex gap-6 items-center">
          <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
            홈
          </Link>

          <Link
            href={session ? "/api-management" : "/login"}
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            API 관리
          </Link>

          <Link
            href={"/download"}
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            다운로드
          </Link>

          {session ? (
            <>
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-md bg-primary text-white text-sm font-semibold hover:bg-primary/90"
              >
                내 대시보드
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-md border border-input text-sm font-semibold hover:bg-muted"
              >
                로그아웃
              </button>
            </>
          ) : (
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
