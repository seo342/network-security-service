"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Download } from "lucide-react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts"

interface CountryData {
  country: string
  threats: number
  percentage: number
  color: string
}

interface GeographyAnalysisProps {
  data: CountryData[]
}

export default function GeographyAnalysis({ data }: GeographyAnalysisProps) {
  return (
    <div className="space-y-6">
      {/* 국가별 위협 분포 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>국가별 위협 분포</CardTitle>
            <CardDescription>위협의 지리적 분포 현황</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.map((country, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{country.country}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{country.threats}</div>
                      <div className="text-sm text-muted-foreground">{country.percentage}%</div>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${country.percentage}%`,
                        backgroundColor: country.color,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 지역별 차단 현황 */}
        <Card>
          <CardHeader>
            <CardTitle>지역별 차단 현황</CardTitle>
            <CardDescription>국가별 IP 차단 통계</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
                <XAxis dataKey="country" stroke="hsl(var(--border))"/>
                <YAxis stroke="hsl(var(--border))"/>
                <Tooltip
                  cursor={{fill:"white"}}
                  contentStyle={{
                    backgroundColor:"white",
                    border: "1px solid black",
                    borderRadius:"8px",
                  }}/>
                  <Bar dataKey="threats">
                    {data.map((entry,index)=>(
                      <Cell key={`cell-${index}`} fill={entry.color}/>
                    ))}
                  </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 지역별 상세 분석 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>지역별 상세 분석</CardTitle>
              <CardDescription>각 지역의 위협 패턴과 특성 분석</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              리포트 다운로드
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3">국가</th>
                  <th className="text-left p-3">총 위협</th>
                  <th className="text-left p-3">DDoS</th>
                  <th className="text-left p-3">무차별 대입</th>
                  <th className="text-left p-3">기타</th>
                  <th className="text-left p-3">차단률</th>
                </tr>
              </thead>
              <tbody>
                {data.map((country, index) => (
                  <tr key={index} className="border-b border-border/50">
                    <td className="p-3 font-medium">{country.country}</td>
                    <td className="p-3">{country.threats}</td>
                    <td className="p-3">{Math.floor(country.threats * 0.4)}</td>
                    <td className="p-3">{Math.floor(country.threats * 0.3)}</td>
                    <td className="p-3">{Math.floor(country.threats * 0.3)}</td>
                    <td className="p-3">
                      <Badge variant="default" className="text-green-500">
                        {Math.floor(Math.random() * 10 + 90)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
