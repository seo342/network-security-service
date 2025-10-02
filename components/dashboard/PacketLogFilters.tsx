"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

export interface PacketFilterState {
  timeRange: string
  protocols: {
    TCP: boolean
    UDP: boolean
    ICMP: boolean
    OTHER: boolean
  }
}

interface PacketLogFiltersProps {
  filters: PacketFilterState
  setFilters: (filters: PacketFilterState) => void
}



export default function PacketLogFilters({ filters, setFilters }: PacketLogFiltersProps) {
  const toggleProtocol = (proto: keyof typeof filters.protocols) => {
    setFilters({
      ...filters,
      protocols: {
        ...filters.protocols,
        [proto]: !filters.protocols[proto],
      },
    })
  }

  return (
    <Card className="w-64 h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">필터</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 시간 범위 */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">시간 범위</Label>
          <Select
            value={filters.timeRange}
            onValueChange={(value) => setFilters({ ...filters, timeRange: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30m">최근 30분</SelectItem>
              <SelectItem value="1h">최근 1시간</SelectItem>
              <SelectItem value="24h">최근 24시간</SelectItem>
              <SelectItem value="7d">최근 7일</SelectItem>
              <SelectItem value="30d">최근 30일</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* 프로토콜 */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">프로토콜</Label>
          <div className="space-y-2">
            {(Object.keys(filters.protocols) as Array<keyof typeof filters.protocols>).map((proto) => (
              <div key={proto} className="flex items-center space-x-2">
                <Checkbox
                  id={`proto-${proto}`}
                  checked={filters.protocols[proto]}
                  onCheckedChange={() => toggleProtocol(proto)}
                />
                <Label htmlFor={`proto-${proto}`} className="text-sm cursor-pointer">
                  {proto}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
