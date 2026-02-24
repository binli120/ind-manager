// Author: Bin Lee
// Email: binlee120@gmail.com
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { resolveAuthEmailRedirectUrl } from "@/lib/auth/auth-redirect"
import { isAdminUser } from "@/lib/auth/is-admin-user"
import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/schema"
import { checkRateLimit } from "@/lib/rate-limit/rate-limit-helpers"

const SERVICE_ROLE_ENV_KEYS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SERVICE_KEY",
] as const

const resendInviteSchema = z.object({
  userId: z.string().trim().min(1),
})

const normalizePrivilege = (value: unknown) => {
  if (value === "system_admin" || value === "user_manager" || value === "user") {
    return value
  }
  return "user"
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const privilege = String(user.user_metadata?.privilege ?? "")
  const role = String(user.user_metadata?.role ?? "")
  const isAdmin = await isAdminUser({
    supabase,
    userId: user.id,
    privilege,
    role,
  })
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const rateLimited = checkRateLimit({ tier: "sensitive", request, userId: user.id })
  if (rateLimited) return rateLimited

  const parsed = resendInviteSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_KEY ??
    ""
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      {
        error:
          `Supabase admin configuration is missing. Set one of: ${SERVICE_ROLE_ENV_KEYS.join(", ")}`,
      },
      { status: 500 },
    )
  }

  const adminClient = createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const { userId } = parsed.data
  const { data: targetUser, error: targetUserError } = await adminClient
    .from("users")
    .select("id,name,email,phone,submission_role,status,tenantid,tenants(name)")
    .eq("id", userId)
    .maybeSingle()

  if (targetUserError) {
    return NextResponse.json(
      { error: targetUserError.message || "Failed to fetch user" },
      { status: 400 },
    )
  }
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }
  if (targetUser.status !== "pending") {
    return NextResponse.json(
      { error: "Only pending users can be re-invited" },
      { status: 400 },
    )
  }

  const { data: authUserData } = await adminClient.auth.admin.getUserById(userId)
  const redirectTo = resolveAuthEmailRedirectUrl(
    request.nextUrl.origin,
    "/auth/reset-password",
  )
  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    targetUser.email,
    {
      redirectTo,
      data: {
        name: targetUser.name,
        role: targetUser.submission_role,
        privilege: normalizePrivilege(authUserData.user?.user_metadata?.privilege),
      },
    },
  )

  if (inviteError) {
    const message = inviteError.message || "Failed to resend invite"
    const normalized = message.toLowerCase()
    const statusCode = normalized.includes("rate limit") ? 429 : 400

    return NextResponse.json({ error: message }, { status: statusCode })
  }

  return NextResponse.json({ user: targetUser })
}
