"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import Link from "next/link"
import PasswordInput from "@/components/auth/PasswordInput"
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter"
import ConfirmPassword from "@/components/auth/ConfirmPassword"
import TermsCheckbox from "@/components/auth/TermsCheckbox"
import { supabase } from "@/lib/supabaseClient"

export default function SignupForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreed: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.")
      return
    }
    // 약관 동의 체크
    if (!formData.agreed) {
      alert("약관에 동의해야 합니다.")
      return
    }

    setIsLoading(true)
    try {
      // Supabase로 회원가입 처리
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name, // 메타데이터로 저장
          },
        },
      })

      if (error) throw error

      // 회원가입 후 프로필 정보 추가
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: data.user.id, // auth.uid()와 동일한 user.id 사용
          name: formData.name,
          email: formData.email,
        })

      if (profileError) throw profileError

      alert("회원가입에 성공했습니다. 가입해 주셔서 진심으로 감사합니다.")

      // 회원가입 후 홈 페이지로 리디렉션
      router.push("/") // 홈페이지로 리디렉션
    } catch (err: any) {
      alert(err.message || "회원가입에 실패했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">회원가입</CardTitle>
        <CardDescription>네트워크 보안 서비스를 시작하세요</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 이름 */}
          <div className="space-y-2">
            <Label htmlFor="name">이름</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="홍길동"
              required
            />
          </div>

          {/* 이메일 */}
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="example@yourEmail.com"
              required
            />
          </div>

          {/* 비밀번호 */}
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <PasswordInput name="password" value={formData.password} onChange={handleInputChange} />
            {formData.password && <PasswordStrengthMeter password={formData.password} />}
          </div>

          {/* 비밀번호 확인 */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">비밀번호 확인</Label>
            <ConfirmPassword
              password={formData.password}
              confirmPassword={formData.confirmPassword}
              onChange={handleInputChange}
            />
          </div>

          {/* 약관 동의 */}
          <TermsCheckbox checked={formData.agreed} onChange={handleInputChange} />

          {/* 버튼 */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "계정 생성 중..." : "계정 만들기"}
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="text-primary hover:underline">
              로그인
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
