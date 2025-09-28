"use client"

interface PasswordStrengthMeterProps {
  password: string
}

// 비밀번호 강도 측정 & 시각화 컴포넌트
export default function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const passwordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    return strength
  }

  const getStrengthColor = (strength: number) => {
    if (strength < 2) return "bg-destructive"
    if (strength < 4) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getStrengthText = (strength: number) => {
    if (strength < 2) return "약함"
    if (strength < 4) return "보통"
    return "강함"
  }

  const strength = passwordStrength(password)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getStrengthColor(strength)}`}
            style={{ width: `${(strength / 5) * 100}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground">{getStrengthText(strength)}</span>
      </div>
    </div>
  )
}
