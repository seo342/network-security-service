// lib/mockData.ts
//예시용 임시 데이터임
// 위협 동향 데이터
import { AlertTriangle, Shield, Clock, TrendingUp, TrendingDown } from "lucide-react"
import type { Metric } from "@/components/analytics/KeyMetrics"
export const threatTrendData = [
  { date: "2025-01-01", threats: 45, blocked: 38, ddos: 12, malware: 15, suspicious: 18 },
  { date: "2025-01-02", threats: 52, blocked: 44, ddos: 18, malware: 12, suspicious: 22 },
  { date: "2025-01-03", threats: 38, blocked: 32, ddos: 8, malware: 18, suspicious: 12 },
  { date: "2025-01-04", threats: 67, blocked: 58, ddos: 25, malware: 20, suspicious: 22 },
  { date: "2025-01-05", threats: 43, blocked: 35, ddos: 15, malware: 14, suspicious: 14 },
  { date: "2025-01-06", threats: 59, blocked: 51, ddos: 22, malware: 18, suspicious: 19 },
  { date: "2025-01-07", threats: 71, blocked: 63, ddos: 28, malware: 23, suspicious: 20 },
]

// 국가별 위협 데이터
export const countryData = [
  { country: "북한", threats: 156, percentage: 35, color: "#ef4444" },
  { country: "중국", threats: 89, percentage: 20, color: "#f97316" },
  { country: "러시아", threats: 67, percentage: 15, color: "#eab308" },
  { country: "이란", threats: 45, percentage: 10, color: "#06b6d4" },
  { country: "기타", threats: 89, percentage: 20, color: "#6b7280" },
]

// 시간대별 데이터
export const hourlyData = [
  { hour: "00", threats: 12, normal: 45 },
  { hour: "01", threats: 8, normal: 32 },
  { hour: "02", threats: 6, normal: 28 },
  { hour: "03", threats: 4, normal: 22 },
  { hour: "04", threats: 7, normal: 25 },
  { hour: "05", threats: 9, normal: 35 },
  { hour: "06", threats: 15, normal: 58 },
  { hour: "07", threats: 23, normal: 78 },
  { hour: "08", threats: 34, normal: 95 },
  { hour: "09", threats: 45, normal: 120 },
  { hour: "10", threats: 52, normal: 135 },
  { hour: "11", threats: 48, normal: 128 },
  { hour: "12", threats: 41, normal: 115 },
  { hour: "13", threats: 38, normal: 108 },
  { hour: "14", threats: 42, normal: 118 },
  { hour: "15", threats: 47, normal: 125 },
  { hour: "16", threats: 39, normal: 112 },
  { hour: "17", threats: 35, normal: 98 },
  { hour: "18", threats: 28, normal: 85 },
  { hour: "19", threats: 22, normal: 72 },
  { hour: "20", threats: 18, normal: 65 },
  { hour: "21", threats: 16, normal: 58 },
  { hour: "22", threats: 14, normal: 52 },
  { hour: "23", threats: 13, normal: 48 },
]

// 공격 유형 데이터
export const attackTypeData = [
  { name: "DDoS 공격", value: 145, color: "#ef4444" },
  { name: "무차별 대입", value: 89, color: "#f97316" },
  { name: "SQL 인젝션", value: 67, color: "#eab308" },
  { name: "XSS 공격", value: 45, color: "#06b6d4" },
  { name: "기타", value: 78, color: "#6b7280" },
]

// 최근 보안 사고 데이터
export const recentIncidents = [
  {
    id: 1,
    time: "2025-01-07 14:23:15",
    type: "DDoS 공격",
    source: "14.44.444.44",
    country: "북한",
    severity: "높음",
    status: "차단됨",
    details: "대량의 HTTP 요청으로 서버 과부하 시도",
  },
  {
    id: 2,
    time: "2025-01-07 13:45:22",
    type: "무차별 대입",
    source: "123.45.67.89",
    country: "중국",
    severity: "중간",
    status: "차단됨",
    details: "로그인 페이지에 대한 반복적인 접근 시도",
  },
  {
    id: 3,
    time: "2025-01-07 12:18:33",
    type: "의심스러운 활동",
    source: "98.76.54.32",
    country: "러시아",
    severity: "낮음",
    status: "모니터링",
    details: "비정상적인 트래픽 패턴 감지",
  },
]
export const mockMetrics: Metric[] = [
  {
    title: "총 위협 탐지",
    value: "446",
    description: (
      <>
        <TrendingUp className="h-3 w-3 text-green-500" />
        <span>+12% 지난 주 대비</span>
      </>
    ) as unknown as string, // JSX를 string 대신 ReactNode로 정의하려면 Metric 타입 수정 필요
    icon: <AlertTriangle className="h-4 w-4 text-destructive" />,
    color: "text-destructive",
  },
  {
    title: "차단 성공률",
    value: "94.2%",
    description: (
      <>
        <TrendingUp className="h-3 w-3 text-green-500" />
        <span>+2.1% 지난 주 대비</span>
      </>
    ) as unknown as string,
    icon: <Shield className="h-4 w-4 text-green-500" />,
    color: "text-green-500",
  },
  {
    title: "고위험 공격",
    value: "23",
    description: (
      <>
        <TrendingDown className="h-3 w-3 text-red-500" />
        <span>-8% 지난 주 대비</span>
      </>
    ) as unknown as string,
    icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    color: "text-yellow-500",
  },
  {
    title: "평균 응답 시간",
    value: "1.2초",
    description: (
      <>
        <TrendingDown className="h-3 w-3 text-green-500" />
        <span>-0.3초 지난 주 대비</span>
      </>
    ) as unknown as string,
    icon: <Clock className="h-4 w-4 text-muted-foreground" />,
  },
]
