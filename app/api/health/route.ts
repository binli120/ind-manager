// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Test database connection
    const { error } = await supabase.from("users").select("count").limit(1)

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
  } catch {
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
