"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function HeroSection() {
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-20"></div>
      <div className="container mx-auto px-4 text-center relative z-10">
        <Badge variant="secondary" className="mb-6 pulse-glow">
          <Zap className="h-4 w-4 mr-2" />
          AI 기반 실시간 위협 탐지
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold text-balance mb-6">
          네트워크를 보호하는
          <br />
          <span className="text-primary">지능형 보안 시스템</span>
        </h1>
        <p className="text-xl text-muted-foreground text-balance mb-8 max-w-2xl mx-auto">
          AI를 활용한 실시간 네트워크 공격을 감지하고 위험 IP 확인으로 컴퓨터를 안전하게 보호하세요.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href={session ? "/dashboard" : "/login"}>무료로 시작하기</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
