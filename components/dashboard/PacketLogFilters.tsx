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
  }
}

interface PacketLogFiltersProps {
  filters: PacketFilterState
  setFilters: (filters: PacketFilterState) => void
}

export default function PacketLogFilters({ filters, setFilters }: PacketLogFiltersProps) {
  // 프로토콜 필터 토글 함수
  const toggleProtocol = (proto: keyof typeof filters.protocols) => {
    setFilters({
      ...filters,
      protocols: {
        ...filters.protocols,
        [proto]: !filters.protocols[proto], // 체크박스 상태를 반전시킴
      },
    })
  }

  return (
    <Card className="w-64 h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">필터</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 시간 범위 선택 */}
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

        {/* 프로토콜 필터링 */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">프로토콜</Label>
          <div className="space-y-2">
            {/* 각 프로토콜 체크박스 */}
            {(Object.keys(filters.protocols) as Array<keyof typeof filters.protocols>).map((proto) => (
              <div key={proto} className="flex items-center space-x-2">
                <Checkbox
                  id={`proto-${proto}`}
                  checked={filters.protocols[proto]} // 체크박스 상태
                  onCheckedChange={() => toggleProtocol(proto)} // 체크박스 상태 변경
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
