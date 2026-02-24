// Author: Bin Lee
// Email: binlee120@gmail.com
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveAuthEmailRedirectUrl } from "@/lib/auth/auth-redirect";
import { isAdminUser } from "@/lib/auth/is-admin-user";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/schema";
import { checkRateLimit } from "@/lib/rate-limit/rate-limit-helpers";

const SERVICE_ROLE_ENV_KEYS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SERVICE_KEY",
] as const;

const inviteUserSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().regex(/^\d{3}-\d{3}-\d{4}$/),
  submission_role: z.enum([
    "reg_affairs_manager_lead",
    "regulatory_writer_medical_writer",
    "ectd_publishing_specialist",
    "clinical_development_lead",
    "medical_monitor",
    "nonclinical_toxicology_lead",
    "cmc_lead",
    "quality_assurance",
    "project_manager",
    "data_manager_biostatistician",
    "document_management_specialist",
  ]),
  tenantid: z.string().trim().min(1).nullable().optional(),
  privilege: z.enum(["system_admin", "user_manager", "user"]),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const privilege = String(user.user_metadata?.privilege ?? "");
  const role = String(user.user_metadata?.role ?? "");
  const isAdmin = await isAdminUser({
    supabase,
    userId: user.id,
    privilege,
    role,
  });

  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rateLimited = checkRateLimit({ tier: "sensitive", request, userId: user.id });
  if (rateLimited) return rateLimited;

  const parsed = inviteUserSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_KEY ??
    "";
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      {
        error:
          `Supabase admin configuration is missing. Set one of: ${SERVICE_ROLE_ENV_KEYS.join(", ")}`,
      },
      { status: 500 },
    );
  }

  const adminClient = createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { name, email, phone, submission_role, tenantid, privilege: targetPrivilege } =
    parsed.data;

  const redirectTo = resolveAuthEmailRedirectUrl(
    request.nextUrl.origin,
    "/auth/reset-password",
  );
  const { data: inviteData, error: inviteError } =
    await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: {
        name,
        privilege: targetPrivilege,
        role: submission_role,
      },
    });

  if (inviteError) {
    const message = inviteError.message || "Failed to invite user";
    const normalized = message.toLowerCase();
    const statusCode =
      normalized.includes("already") || normalized.includes("exists") ? 409 : 400;

    return NextResponse.json({ error: message }, { status: statusCode });
  }

  const invitedUserId = inviteData.user?.id;
  if (!invitedUserId) {
    return NextResponse.json(
      { error: "Invitation created without user id" },
      { status: 500 },
    );
  }

  const { data: userRow, error: userError } = await adminClient
    .from("users")
    .upsert(
      {
        id: invitedUserId,
        name,
        email,
        phone,
        submission_role,
        tenantid: tenantid ?? null,
        status: "pending",
      },
      { onConflict: "id" },
    )
    .select("id,name,email,phone,submission_role,status,tenantid,tenants(name)")
    .single();

  if (userError) {
    return NextResponse.json(
      { error: userError.message || "Failed to sync user profile" },
      { status: 400 },
    );
  }

  return NextResponse.json({ user: userRow }, { status: 201 });
}
