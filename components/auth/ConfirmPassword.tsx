"use client"

import { Input } from "@/components/ui/input"
import { Eye, EyeOff, Check } from "lucide-react"
import { useState } from "react"

interface ConfirmPasswordProps {
  password: string
  confirmPassword: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

// 비밀번호 확인 입력창 + 일치 여부 표시
export default function ConfirmPassword({ password, confirmPassword, onChange }: ConfirmPasswordProps) {
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  return (
    <div className="relative">
      <Input
        id="confirmPassword"
        name="confirmPassword"
        type={showConfirmPassword ? "text" : "password"}
        placeholder="비밀번호를 다시 입력하세요"
        value={confirmPassword}
        onChange={onChange}
        required
        className="bg-background pr-10"
      />
      <button
        type="button"
        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>

      {confirmPassword && password === confirmPassword && (
        <div className="flex items-center gap-2 text-green-500 text-sm mt-1">
          <Check className="h-4 w-4" />
          비밀번호가 일치합니다
        </div>
      )}
    </div>
  )
}
