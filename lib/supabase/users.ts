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
    phone: row.phone,
    role: row.role,
    company: row.tenants?.name ?? "",
    status: row.status,
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
