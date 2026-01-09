// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
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

    const { table, action, data, filters } = await request.json()

    if (!table || !action) {
      return NextResponse.json({ error: "Table and action are required" }, { status: 400 })
    }

    let result

    switch (action) {
      case "select":
        let query = supabase.from(table).select(data?.select || "*")

        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value)
          })
        }

        if (data?.limit) {
          query = query.limit(data.limit)
        }

        if (data?.order) {
          query = query.order(data.order.column, { ascending: data.order.ascending ?? true })
        }

        result = await query
        break

      case "insert":
        if (!data?.values) {
          return NextResponse.json({ error: "Values are required for insert" }, { status: 400 })
        }
        result = await supabase.from(table).insert(data.values).select()
        break

      case "update":
        if (!data?.values || !filters) {
          return NextResponse.json({ error: "Values and filters are required for update" }, { status: 400 })
        }
        let updateQuery = supabase.from(table).update(data.values)

        Object.entries(filters).forEach(([key, value]) => {
          updateQuery = updateQuery.eq(key, value)
        })

        result = await updateQuery.select()
        break

      case "delete":
        if (!filters) {
          return NextResponse.json({ error: "Filters are required for delete" }, { status: 400 })
        }
        let deleteQuery = supabase.from(table)

        Object.entries(filters).forEach(([key, value]) => {
          deleteQuery = deleteQuery.delete().eq(key, value)
        })

        result = await deleteQuery
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 400 })
    }

    return NextResponse.json({ data: result.data })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
