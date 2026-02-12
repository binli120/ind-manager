// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import type { User, UserRole } from "@/lib/users/types";
import {
  deleteUserProjectAssignment,
  fetchAssignedProjectIds,
  fetchUserRowById,
  fetchUserRows,
  insertUserProjectAssignment,
  insertUserRow,
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
  tenantId: string;
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
