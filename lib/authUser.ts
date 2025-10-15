import { supabaseAdmin } from "@/lib/supabaseServiceClient"

export async function getUserAndApiKeys(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader) throw new Error("Unauthorized")

  const token = authHeader.split(" ")[1]
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
  if (userError || !user) throw new Error("Invalid user")

  const { data: keys, error: keyError } = await supabaseAdmin
    .from("api_keys")
    .select("id")
    .eq("user_id", user.id)

  if (keyError) throw keyError
  if (!keys || keys.length === 0) throw new Error("No API keys found")

  const keyIds = keys.map((k) => k.id)
  return { user, keyIds }
}
