import type { User, UserRole } from "@/components/ui/users/users-page";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/schema";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  submission_role: Database["public"]["Enums"]["submission_role"];
  status: Database["public"]["Enums"]["user_status"] | null;
  tenantid: string | null;
  tenants?: { name?: string | null } | null;
};

const USER_SELECT_WITH_TENANT =
  "id,name,email,phone,submission_role,status,tenantid,tenants(name)";

const mapUserRow = (row: UserRow): User => ({
  id: row.id,
  name: row.name ?? "",
  email: row.email,
  phone: row.phone ?? "",
  role: row.submission_role as UserRole,
  company: row.tenants?.name ?? "",
  status: (row.status as User["status"]) ?? "pending",
});

export async function fetchUsers(tenantId?: string): Promise<User[]> {
  const supabase = createClient();

  let query = supabase
    .from("users")
    .select(USER_SELECT_WITH_TENANT)
    .order("name", { ascending: true });

  if (tenantId) {
    query = query.eq("tenantid", tenantId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message || "Failed to fetch users");
  }

  const rows = (data ?? []) as UserRow[];
  return rows.map(mapUserRow);
}

export async function updateUserStatus(
  id: string,
  status: Database["public"]["Enums"]["user_status"],
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("users")
    .update({ status })
    .eq("id", id)
    .select(USER_SELECT_WITH_TENANT)
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update user status");
  }

  const mapped = mapUserRow(data as UserRow);
  return {
    ...mapped,
    phone: mapped.phone,
    status: mapped.status,
  };
}

export async function createUser(user: {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  tenantId: string;
}) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("users")
    .insert({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      submission_role: user.role,
      tenantid: user.tenantId,
      status: "pending",
    })
    .select(USER_SELECT_WITH_TENANT)
    .single();

  if (error) {
    throw new Error(error.message || "Failed to create user");
  }

  const mapped = mapUserRow(data as UserRow);
  return {
    ...mapped,
    phone: mapped.phone,
    status: mapped.status,
  };
}

export async function fetchCurrentUser(id: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("users")
    .select(USER_SELECT_WITH_TENANT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to fetch current user");
  }

  return data ? mapUserRow(data as UserRow) : null;
}

export async function fetchUserProjectIds(userId: string): Promise<string[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_project")
    .select("project_id")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message || "Failed to fetch assignments");
  }

  return (data ?? [])
    .map((row) => row.project_id)
    .filter((projectId): projectId is string => Boolean(projectId));
}

export async function addUserToProject(
  userId: string,
  projectId: string,
  currentUserId?: string,
) {
  const supabase = createClient();

  const values: Database["public"]["Tables"]["user_project"]["Insert"] = {
    user_id: userId,
    project_id: projectId,
    ...(currentUserId ? { created_by: currentUserId } : {}),
  };

  const { error } = await supabase.from("user_project").insert(values);
  if (error) {
    throw new Error(error.message || "Failed to assign project");
  }
}

export async function removeUserFromProject(userId: string, projectId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("user_project")
    .delete()
    .eq("user_id", userId)
    .eq("project_id", projectId);

  if (error) {
    throw new Error(error.message || "Failed to remove project assignment");
  }
}
