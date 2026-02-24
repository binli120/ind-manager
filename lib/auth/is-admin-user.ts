import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/schema";

const adminPrivileges = [
  "system_admin",
  "user_manager",
  "admin",
  "system_administrator",
] as const;

type AdminPrivilege = (typeof adminPrivileges)[number];

export function hasAdminPrivilege(
  privilege?: string | null,
  role?: string | null,
) {
  return (
    (privilege != null &&
      adminPrivileges.includes(privilege as AdminPrivilege)) ||
    (role != null && adminPrivileges.includes(role as AdminPrivilege))
  );
}

export async function isAdminUser(args: {
  supabase: SupabaseClient<Database>;
  userId: string;
  privilege?: string | null;
  role?: string | null;
}) {
  const { supabase, userId, privilege, role } = args;

  if (hasAdminPrivilege(privilege, role)) {
    return true;
  }

  const { data } = await supabase
    .from("users")
    .select("submission_role")
    .eq("id", userId)
    .maybeSingle();

  return (
    (data as { submission_role?: string } | null)?.submission_role ===
    "system_administrator"
  );
}
