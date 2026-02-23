// Author: Bin Lee
// Email: binlee120@gmail.com
import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import type { Database } from "@/lib/supabase/schema"
import { checkRateLimit } from "@/lib/rate-limit/rate-limit-helpers"

const adminPrivileges = [
  "system_admin",
  "user_manager",
  "admin",
  "system_administrator",
] as const
type AdminPrivilege = (typeof adminPrivileges)[number]

const updateUserSchema = z.object({
  name: z.string().optional(),
  avatar_url: z.string().url().optional(),
  phone: z.string().optional(),
  status: z.string().optional(),
})

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()

  try {
    const { id } = await context.params
    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rateLimited = checkRateLimit({ tier: "read", request, userId: user.id })
    if (rateLimited) return rateLimited

    const privilege = (user.user_metadata?.privilege ?? "") as AdminPrivilege | string
    const role = (user.user_metadata?.role ?? "") as AdminPrivilege | string
    let isAdmin =
      adminPrivileges.includes(privilege as AdminPrivilege) ||
      adminPrivileges.includes(role as AdminPrivilege)
    if (!isAdmin) {
      const { data: userRow } = await supabase
        .from("users")
        .select("submission_role")
        .eq("id", user.id)
        .maybeSingle()
      isAdmin =
        (userRow as { submission_role?: string } | null)?.submission_role ===
        "system_administrator"
    }

    if (!isAdmin && user.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get specific user by ID
    const { data: userData, error } = await supabase.from("users").select("*").eq("id", id).single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ user: userData })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()

  try {
    const { id } = await context.params
    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rateLimitedPut = checkRateLimit({ tier: "write", request, userId: user.id })
    if (rateLimitedPut) return rateLimitedPut

    const privilege = (user.user_metadata?.privilege ?? "") as AdminPrivilege | string
    const role = (user.user_metadata?.role ?? "") as AdminPrivilege | string
    let isAdmin =
      adminPrivileges.includes(privilege as AdminPrivilege) ||
      adminPrivileges.includes(role as AdminPrivilege)
    if (!isAdmin) {
      const { data: userRow } = await supabase
        .from("users")
        .select("submission_role")
        .eq("id", user.id)
        .maybeSingle()
      isAdmin =
        (userRow as { submission_role?: string } | null)?.submission_role ===
        "system_administrator"
    }

    // Only allow users to update their own profile (or admins)
    if (!isAdmin && user.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const userData = updateUserSchema.parse(await request.json())

    // Update user profile
      const { data, error } = await supabase
        .from("users")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({ ...(userData as any), updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ user: data[0] })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()

  try {
    const { id } = await context.params
    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rateLimitedDel = checkRateLimit({ tier: "sensitive", request, userId: user.id })
    if (rateLimitedDel) return rateLimitedDel

    const privilege = (user.user_metadata?.privilege ?? "") as AdminPrivilege | string
    const role = (user.user_metadata?.role ?? "") as AdminPrivilege | string
    let isAdmin =
      adminPrivileges.includes(privilege as AdminPrivilege) ||
      adminPrivileges.includes(role as AdminPrivilege)
    if (!isAdmin) {
      const { data: userRow } = await supabase
        .from("users")
        .select("submission_role")
        .eq("id", user.id)
        .maybeSingle()
      isAdmin =
        (userRow as { submission_role?: string } | null)?.submission_role ===
        "system_administrator"
    }

    // Only allow users to delete their own profile (or admins)
    if (!isAdmin && user.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
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
            "Supabase admin configuration is missing. Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY.",
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

    // Delete auth account first (ignore not-found to allow idempotent cleanup).
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(id)
    if (authDeleteError && !/not found/i.test(authDeleteError.message || "")) {
      return NextResponse.json({ error: authDeleteError.message }, { status: 400 })
    }

    // Delete app profile row.
    const { error } = await supabase.from("users").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: "User deleted successfully" })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
