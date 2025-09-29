"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

interface TermsCheckboxProps {
  checked: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

// 약관 동의 체크박스 컴포넌트
export default function TermsCheckbox({ checked, onChange }: TermsCheckboxProps) {
  return (
    <div className="flex items-center space-x-2">
      <Input
        type="checkbox"
        id="terms"
        name="agreed"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4"
      />
      <Label htmlFor="terms" className="text-sm text-muted-foreground">
          이용약관
        및{" "}
          개인정보처리방침
        에 동의합니다.
      </Label>
    </div>
  )
}
