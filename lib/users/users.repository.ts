import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/schema";

export type UserSelectRow = {
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

export const fetchUserRows = async (tenantId?: string): Promise<UserSelectRow[]> => {
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

  return (data ?? []) as UserSelectRow[];
};

export const updateUserStatusRow = async ({
  id,
  status,
}: {
  id: string;
  status: Database["public"]["Enums"]["user_status"];
}): Promise<UserSelectRow> => {
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

  return data as UserSelectRow;
};

export const insertUserRow = async (user: {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Database["public"]["Enums"]["submission_role"];
  tenantId: string;
}): Promise<UserSelectRow> => {
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

  return data as UserSelectRow;
};

export const fetchUserRowById = async (id: string): Promise<UserSelectRow | null> => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("users")
    .select(USER_SELECT_WITH_TENANT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to fetch current user");
  }

  return data ? (data as UserSelectRow) : null;
};

export const fetchAssignedProjectIds = async (userId: string): Promise<string[]> => {
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
};

export const insertUserProjectAssignment = async ({
  userId,
  projectId,
  currentUserId,
}: {
  userId: string;
  projectId: string;
  currentUserId?: string;
}) => {
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
};

export const deleteUserProjectAssignment = async ({
  userId,
  projectId,
}: {
  userId: string;
  projectId: string;
}) => {
  const supabase = createClient();

  const { error } = await supabase
    .from("user_project")
    .delete()
    .eq("user_id", userId)
    .eq("project_id", projectId);

  if (error) {
    throw new Error(error.message || "Failed to remove project assignment");
  }
};
