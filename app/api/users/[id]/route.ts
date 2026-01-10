// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const adminPrivileges = ["system_admin", "user_manager"] as const
type AdminPrivilege = (typeof adminPrivileges)[number]

const updateUserSchema = z.object({
  name: z.string().optional(),
  avatar_url: z.string().url().optional(),
  phone: z.string().optional(),
  status: z.string().optional(),
})

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  void _request

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

    if (!isAdmin && user.id !== params.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get specific user by ID
    const { data: userData, error } = await supabase.from("users").select("*").eq("id", params.id).single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ user: userData })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

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

    // Only allow users to update their own profile (or admins)
    if (!isAdmin && user.id !== params.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const userData = updateUserSchema.parse(await request.json())

    // Update user profile
    const { data, error } = await supabase
      .from("users")
      .update({
        ...userData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ user: data[0] })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  void _request

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

    // Only allow users to delete their own profile (or admins)
    if (!isAdmin && user.id !== params.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete user profile
    const { error } = await supabase.from("users").delete().eq("id", params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: "User deleted successfully" })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
