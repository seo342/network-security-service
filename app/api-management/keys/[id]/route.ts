import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseServiceClient"

// 특정 API 키 삭제
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: "Invalid user" }, { status: 401 })
    }

    // 본인 소유 API 키만 삭제 가능하도록 조건 추가
    const { error } = await supabaseAdmin
      .from("api_keys")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
