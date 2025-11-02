"use client"

import { Calendar } from "lucide-react"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

export type RangeType = "today" | "7d" | "30d"

interface DateRangeSelectorProps {
  value: RangeType
  onChange: (value: RangeType) => void
}

export default function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <Select value={value} onValueChange={(val) => onChange(val as RangeType)}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="기간 선택" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">오늘</SelectItem>
          <SelectItem value="7d">최근 7일</SelectItem>
          <SelectItem value="30d">최근 30일</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
