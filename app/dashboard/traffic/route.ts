import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServiceClient";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("traffic_logs")
      .select("*")
      .order("time", { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ logs: data });
  } catch (err: any) {
    console.error("🚨 traffic_logs fetch error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
