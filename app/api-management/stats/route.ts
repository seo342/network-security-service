// app/api-management/stats/route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return NextResponse.json({ error: "Missing token" }, { status: 401 });
  const apiKey = auth.split(" ")[1];

  // 키 검증
  const { data: keyRow, error: keyErr } = await supabaseServerClient
    .from("api_keys")
    .select("id, user_id, status")
    .eq("api_key", apiKey)
    .limit(1)
    .maybeSingle();

  if (keyErr) return NextResponse.json({ error: keyErr.message }, { status: 500 });
  if (!keyRow || keyRow.status !== "active") return NextResponse.json({ error: "Invalid API key" }, { status: 403 });

  try {
    // 예시: api_usage 테이블에서 최근 24시간 요청 수, 탐지 수, 차단된 IP 수 등 집계
    // 테이블/컬럼 명은 실제 스키마에 맞게 바꿔주세요.
    const { data: usageData, error: usageErr } = await supabaseServerClient.rpc("get_dashboard_stats", {
      // 예: 서버에 미리 작성한 PL/pgSQL 함수 호출 가능. 없으면 아래 예제처럼 직접 쿼리 대체.
    });

    if (usageErr) {
      // fallback: 간단 집계 예시 (적절한 쿼리가 필요)
      const { data: totalRequests, error: trErr } = await supabaseServerClient
        .from("api_usage")
        .select("requests", { count: "exact" })
        .match({}); // 단순 예시
      // (실 사용에서는 정확한 집계 쿼리를 작성하세요)
    }

    // 임시 더미 응답 (실제 쿼리 결과로 교체)
    const stats = {
      totalRequests: 15320,
      threatsDetected: 87,
      blockedIPs: 12,
      uptime: "99.8%",
    };

    return NextResponse.json(stats);
  } catch (err: any) {
    return NextResponse.json({ error: String(err.message) }, { status: 500 });
  }
}
