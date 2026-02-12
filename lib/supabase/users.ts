// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import type { User, UserPrivilege, UserRole } from "@/lib/users/types";
import {
  deleteUserProjectAssignment,
  fetchAssignedProjectIds,
  fetchUserRowById,
  fetchUserRows,
  insertUserProjectAssignment,
  insertUserRow,
  updateUserRow,
  updateUserStatusRow,
  type UserSelectRow,
} from "@/lib/users/users.repository";
import type { Database } from "@/lib/supabase/schema";

const mapUserRow = (row: UserSelectRow): User => ({
  id: row.id,
  name: row.name ?? "",
  email: row.email,
  phone: row.phone ?? "",
  role: row.submission_role as UserRole,
  company: row.tenants?.name ?? "",
  status: (row.status as User["status"]) ?? "pending",
});

const asJson = async <T>(response: Response) => {
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(
      (payload as { error?: string; message?: string })?.error ||
        (payload as { error?: string; message?: string })?.message ||
        "Request failed",
    );
  }

  return (await response.json()) as T;
};

export async function fetchUsers(tenantId?: string): Promise<User[]> {
  const rows = await fetchUserRows(tenantId);
  return rows.map(mapUserRow);
}

export async function updateUserStatus(
  id: string,
  status: Database["public"]["Enums"]["user_status"],
) {
  const mapped = mapUserRow(await updateUserStatusRow({ id, status }));
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
  tenantId?: string;
}) {
  const mapped = mapUserRow(
    await insertUserRow({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      tenantId: user.tenantId,
    }),
  );

  return {
    ...mapped,
    phone: mapped.phone,
    status: mapped.status,
  };
}

export async function inviteUser(user: {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  tenantId?: string;
  privilege: UserPrivilege;
}) {
  const response = await fetch("/api/admin/users/invite", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: user.name,
      email: user.email,
      phone: user.phone,
      submission_role: user.role,
      tenantid: user.tenantId ?? null,
      privilege: user.privilege,
    }),
  });

  const payload = await asJson<{ user: UserSelectRow }>(response);
  const mapped = mapUserRow(payload.user);

  return {
    ...mapped,
    phone: mapped.phone,
    status: mapped.status,
  };
}

export async function updateUser(user: {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  tenantId: string;
}) {
  const mapped = mapUserRow(
    await updateUserRow({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      tenantId: user.tenantId,
    }),
  );

  return {
    ...mapped,
    phone: mapped.phone,
    status: mapped.status,
  };
}

export async function fetchCurrentUser(id: string) {
  const row = await fetchUserRowById(id);
  return row ? mapUserRow(row) : null;
}

export async function fetchUserProjectIds(userId: string): Promise<string[]> {
  return fetchAssignedProjectIds(userId);
}

export async function addUserToProject(
  userId: string,
  projectId: string,
  currentUserId?: string,
) {
  await insertUserProjectAssignment({
    userId,
    projectId,
    currentUserId,
  });
}

export async function removeUserFromProject(userId: string, projectId: string) {
  await deleteUserProjectAssignment({
    userId,
    projectId,
  });
}
