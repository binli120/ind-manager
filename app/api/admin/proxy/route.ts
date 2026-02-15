// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { checkRateLimit } from "@/lib/rate-limit/rate-limit-helpers"

const adminPrivileges = [
  "system_admin",
  "user_manager",
  "admin",
  "system_administrator",
] as const
type AdminPrivilege = (typeof adminPrivileges)[number]

const requestSchema = z.object({
  table: z.enum(["users", "tenants"]),
  action: z.enum(["select", "insert", "update"]),
  data: z
    .object({
      select: z.string().optional(),
      values: z.record(z.any()).optional(),
      limit: z.number().int().positive().optional(),
      order: z
        .object({
          column: z.string(),
          ascending: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
  filters: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
})

const tablePolicies = {
  users: {
    select: {
      allowedFilters: ["id", "tenantid"] as const,
      allowedSelect: ["*", "*, tenants(name)"] as const,
      adminOnly: false,
    },
    insert: {
      requiredFields: ["id", "name", "email", "phone", "submission_role", "tenantid", "status"] as const,
      allowedFields: [
        "id",
        "name",
        "email",
        "phone",
        "submission_role",
        "tenantid",
        "status",
        "avatar_url",
      ] as const,
      adminOnly: true,
    },
    update: {
      allowedFilters: ["id"] as const,
      allowedFields: ["status", "name", "phone", "submission_role", "tenantid", "avatar_url"] as const,
      adminOnly: true,
    },
  },
  tenants: {
    select: {
      allowedFilters: ["id"] as const,
      allowedSelect: ["*"] as const,
      adminOnly: true,
    },
    insert: {
      requiredFields: ["name", "address", "contact_person", "contact_email", "contact_number", "status"] as const,
      allowedFields: ["name", "address", "contact_person", "contact_email", "contact_number", "status"] as const,
      adminOnly: true,
    },
    update: {
      allowedFilters: ["id"] as const,
      allowedFields: ["status", "name", "address", "contact_person", "contact_email", "contact_number"] as const,
      adminOnly: true,
    },
  },
} as const

type FilterRecord = Record<string, string | number | boolean>

const filterDisallowedKeys = (filters: Record<string, unknown> | undefined, allowed: readonly string[]) => {
  if (!filters) return undefined
  const entries = Object.entries(filters)
  if (entries.some(([key]) => !allowed.includes(key))) {
    return { error: `Unsupported filter key. Allowed: ${allowed.join(",")}` }
  }
  return Object.fromEntries(entries) as FilterRecord
}

const pickAllowedFields = (
  values: Record<string, unknown> | undefined,
  allowed: readonly string[],
  required?: readonly string[],
) => {
  if (!values) return { error: "Values are required" }

  const missingRequired = required?.filter((field) => !(field in values))
  if (missingRequired && missingRequired.length > 0) {
    return { error: `Missing required fields: ${missingRequired.join(",")}` }
  }

  const sanitized = Object.fromEntries(Object.entries(values).filter(([key]) => allowed.includes(key)))
  const rejected = Object.keys(values).filter((key) => !allowed.includes(key))
  if (rejected.length > 0) {
    return { error: `Unsupported fields: ${rejected.join(",")}` }
  }
  return { value: sanitized }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Authenticate caller
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rateLimited = checkRateLimit({ tier: "write", request, userId: user.id })
  if (rateLimited) return rateLimited

  const parsed = requestSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 })
  }

  const { table, action, data, filters } = parsed.data
  const policy = tablePolicies[table]
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

    const submissionRole = (userRow as { submission_role?: string } | null)
      ?.submission_role

    if (submissionRole === "system_administrator") {
      isAdmin = true
    }
  }

  if (policy[action as keyof typeof policy]?.adminOnly && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { allowedFilters, allowedSelect, allowedFields, requiredFields } = policy[action as keyof typeof policy] as {
    allowedFilters?: readonly string[]
    allowedSelect?: readonly string[]
    allowedFields?: readonly string[]
    requiredFields?: readonly string[]
  }

  const validatedFilters = filterDisallowedKeys(filters, allowedFilters ?? [])
  if (validatedFilters && "error" in validatedFilters) {
    return NextResponse.json({ error: validatedFilters.error }, { status: 400 })
  }

  const selectClause = data?.select ?? allowedSelect?.[0] ?? "*"
  if (allowedSelect && !allowedSelect.includes(selectClause)) {
    return NextResponse.json({ error: "Unsupported select clause" }, { status: 400 })
  }

  if (!isAdmin && table === "users" && action === "select") {
    const filterKeys = validatedFilters ? Object.keys(validatedFilters) : []
    const hasTenantScope = filterKeys.includes("tenantid")
    const isSelfLookup = filterKeys.includes("id") && validatedFilters && validatedFilters.id === user.id
    if (!hasTenantScope && !isSelfLookup) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  let result

  switch (action) {
    case "select": {
      // Tenants table not in generated types; fall back to untyped call.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = supabase.from<any, any>(table).select(selectClause)

      if (validatedFilters) {
        Object.entries(validatedFilters).forEach(([key, value]) => {
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
    }

    case "insert": {
      const sanitized = pickAllowedFields(data?.values, allowedFields ?? [], requiredFields)
      if ("error" in sanitized) {
        return NextResponse.json({ error: sanitized.error }, { status: 400 })
      }
      // @ts-expect-error table may be "tenants"
      result = await supabase.from(table).insert(sanitized.value).select(selectClause)
      break
    }

    case "update": {
      const sanitized = pickAllowedFields(data?.values, allowedFields ?? [])
      if ("error" in sanitized) {
        return NextResponse.json({ error: sanitized.error }, { status: 400 })
      }
      if (!validatedFilters || Object.keys(validatedFilters).length === 0) {
        return NextResponse.json({ error: "Filters are required for update" }, { status: 400 })
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let updateQuery = supabase.from<any, any>(table).update(sanitized.value)

      Object.entries(validatedFilters).forEach(([key, value]) => {
        updateQuery = updateQuery.eq(key, value)
      })

      result = await updateQuery.select(selectClause)
      break
    }

    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 400 })
  }

  return NextResponse.json({ data: result.data })
}
