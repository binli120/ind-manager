import { User, UserRole } from "@/components/ui/users/users-page";

export async function fetchUsers(): Promise<User[]> {
    const res = await fetch("/api/database", {
        method: "POST",
        body: JSON.stringify({
        table: "users",
        action: "select",
        data: { select: "*" },
        }),
    });

    const { data } = await res.json();

    return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        role: row.role,
        company: row.company,
        status: row.status,
    }));
    }

    export async function updateUserStatus(id: string, status: string) {
    const res = await fetch("/api/database", {
        method: "POST",
        body: JSON.stringify({
        table: "users",
        action: "update",
        data: { values: { status } },
        filters: { id },
        }),
    });

    const { data } = await res.json();
    const row = data[0];

    return {
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        role: row.role,
        company: row.company,
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
  const res = await fetch("/api/database", {
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
      },
    }),
  });

  const jsonResponse = await res.json();
  const { data, error} = jsonResponse;
  const row = data[0];

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    company: row.company,
    status: row.status,
  };
}