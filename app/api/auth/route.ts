// Author: Bin Lee
// Email: binlee120@gmail.com
import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit/rate-limit-helpers"

export async function POST(request: NextRequest) {
  const rateLimited = checkRateLimit({ tier: "auth", request })
  if (rateLimited) return rateLimited

  const supabase = await createClient()
  const { email, password, action } = await request.json()

  try {
    if (action === "sign-up") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${request.nextUrl.origin}/protected`,
        },
      })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({
        message: "Check your email for verification link",
        user: data.user,
      })
    }

    if (action === "sign-in") {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({
        message: "Signed in successfully",
        user: data.user,
      })
    }

    if (action === "sign-out") {
      const { error } = await supabase.auth.signOut()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ message: "Signed out successfully" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const rateLimited = checkRateLimit({ tier: "read", request })
  if (rateLimited) return rateLimited

  const supabase = await createClient()

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({ user })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
