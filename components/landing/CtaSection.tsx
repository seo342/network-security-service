"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function CtaSection() {
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <section className="py-20 bg-card/30">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">지금 바로 시작하세요</h2>
        <p className="text-xl text-muted-foreground text-balance mb-8 max-w-2xl mx-auto">
          무료 체험으로 SecureNet AI의 강력한 보안 기능을 경험해보세요.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href={session ? "/dashboard" : "/login"}>무료 체험 시작</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href={session ? "/api-management" : "/login"}>API 관리</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
