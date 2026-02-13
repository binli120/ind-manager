// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const adminPrivileges = [
  "system_admin",
  "user_manager",
  "admin",
  "system_administrator",
] as const
type AdminPrivilege = (typeof adminPrivileges)[number]

const userProfileSchema = z.object({
  name: z.string().optional(),
  avatar_url: z.string().url().optional(),
  phone: z.string().optional(),
  status: z.string().optional(),
})

export async function GET() {
  const supabase = await createClient()

  try {
    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get all users (admin only)
    const { data: users, error } = await supabase.from("users").select("*")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ users })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userData = userProfileSchema.parse(await request.json())

    if (!user.email) {
      return NextResponse.json({ error: "User email missing" }, { status: 400 })
    }

    // Create or update user profile
    const { data, error } = await supabase
      .from("users")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert({ id: user.id, email: user.email, ...(userData as any) })
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ user: data[0] })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
