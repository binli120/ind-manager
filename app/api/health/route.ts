import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Test database connection
    const { data, error } = await supabase.from("users").select("count").limit(1)

    if (error) {
      return NextResponse.json(
        {
          status: "error",
          database: "disconnected",
          error: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        database: "error",
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
