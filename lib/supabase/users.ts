import { User, UserRole } from "@/components/ui/users/users-page";

type UserRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: string;
  tenants?: { name?: string | null } | null;
};

const ADMIN_PROXY_ENDPOINT = "/api/admin/proxy";

const asJson = async <T>(res: Response) => {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || "Request failed");
  }
  return (await res.json()) as T;
};

export async function fetchUsers(tenantId?: string): Promise<User[]> {
  const res = await fetch(ADMIN_PROXY_ENDPOINT, {
    method: "POST",
    body: JSON.stringify({
      table: "users",
      action: "select",
      data: { select: "*, tenants(name)" },
      ...(tenantId ? { filters: { tenantid: tenantId } } : {}),
    }),
  });

  const { data } = await asJson<{ data: UserRow[] }>(res);

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? "",
    role: row.role,
    company: row.tenants?.name ?? "",
    status: (row.status as User["status"]) ?? "pending",
  }));
}

export async function updateUserStatus(id: string, status: string) {
  const res = await fetch(ADMIN_PROXY_ENDPOINT, {
    method: "POST",
    body: JSON.stringify({
      table: "users",
      action: "update",
      data: { values: { status }, select: "*, tenants(name)" },
      filters: { id },
    }),
  });

  const { data } = await asJson<{ data: UserRow[] }>(res);
  const row = data[0];

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    company: row.tenants?.name ?? "",
    status: row.status,
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
  const res = await fetch(ADMIN_PROXY_ENDPOINT, {
    method: "POST",
    body: JSON.stringify({
      table: "users",
      action: "insert",
      data: {
        values: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          submission_role: user.role,
          tenantid: user.tenantId,
          status: "pending",
        },
        select: "*, tenants(name)",
      },
    }),
  });

  const { data } = await asJson<{ data: UserRow[] }>(res);
  const row = data[0];

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    company: row.tenants?.name ?? "",
    status: row.status,
  };
}

export async function fetchCurrentUser(id: string) {
  const res = await fetch(ADMIN_PROXY_ENDPOINT, {
    method: "POST",
    body: JSON.stringify({
      table: "users",
      action: "select",
      data: { select: "*" },
      filters: { id },
    }),
  });
  const { data } = await asJson<{ data: UserRow[] }>(res);
  return data?.[0] || null;
}

export async function fetchUserProjectIds(userId: string): Promise<string[]> {
  const res = await fetch("/api/database", {
    method: "POST",
    body: JSON.stringify({
      table: "user_project",
      action: "select",
      data: { select: "project_id" },
      filters: { user_id: userId },
    }),
  });
  
  const json = await res.json();
  if (json.error) {
    console.error("fetchUserProjectIds error:", json.error);
    throw new Error(json.error.message || "Failed to fetch assignments");
  }
  
  return json.data ? json.data.map((row: { project_id: string }) => row.project_id) : [];
}

export async function addUserToProject(userId: string, projectId: string, currentUserId?: string) {
  const values: Record<string, string> = {
    user_id: userId,
    project_id: projectId,
  };
  
  if (currentUserId) {
    values.created_by = currentUserId;
  }

  const res = await fetch("/api/database", {
    method: "POST",
    body: JSON.stringify({
      table: "user_project",
      action: "insert",
      data: { values },
    }),
  });
  
  const json = await res.json();
  if (json.error) {
    console.error("addUserToProject error:", json.error);
    throw new Error(json.error.message || "Failed to assign project");
  }
}

export async function removeUserFromProject(userId: string, projectId: string) {
  const fetchRes = await fetch("/api/database", {
    method: "POST",
    body: JSON.stringify({
      table: "user_project",
      action: "select",
      data: { select: "id" },
      filters: { user_id: userId, project_id: projectId },
    }),
  });

  const { data, error } = await fetchRes.json();
  
  if (error) {
    console.error("removeUserFromProject find error:", error);
    throw new Error(error.message);
  }

  if (data && data.length > 0) {
    const deleteRes = await fetch("/api/database", {
      method: "POST",
      body: JSON.stringify({
        table: "user_project",
        action: "delete",
        filters: { id: data[0].id },
      }),
    });
    const deleteJson = await deleteRes.json();
    if (deleteJson.error) {
      throw new Error(deleteJson.error.message);
    }
  }
}
