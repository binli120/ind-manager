// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const adminPrivileges = ["system_admin", "user_manager"] as const
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
    const isAdmin = adminPrivileges.includes(privilege as AdminPrivilege)
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

    // Create or update user profile
    const { data, error } = await supabase
      .from("users")
      .upsert({
        id: user.id,
        email: user.email,
        ...userData,
        updated_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ user: data[0] })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
