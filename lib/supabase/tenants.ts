import { Tenant } from "@/components/ui/tenants/tenants-page";

export async function fetchTenants(tenantId?: string): Promise<Tenant[]> {
  const res = await fetch("/api/database", {
    method: "POST",
    body: JSON.stringify({
      table: "tenants",
      action: "select",
      data: { select: "*" },
      ...(tenantId ? { filters: { id: tenantId } } : {}),
    }),
  });

  const { data } = await res.json();

  return data.map((row: any) => ({
    id: row.id,
    name: row.name,
    companyAddress: row.address ?? "",
    contactPerson: row.contact_person ?? "",
    contactEmail: row.contact_email ?? "",
    contactPhone: row.contact_number?.toString() ?? "",
    status: row.status,
  }));
}

export async function updateTenantStatus(id: string, status: string) {
  const res = await fetch("/api/database", {
    method: "POST",
    body: JSON.stringify({
      table: "tenants",
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
    companyAddress: row.address,
    contactPerson: row.contact_person,
    contactEmail: row.contact_email,
    contactPhone: row.contact_number,
    status: row.status,
  };
}

export async function createTenant(tenant: {
  name: string;
  companyAddress?: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
}) {
  const res = await fetch("/api/database", {
    method: "POST",
    body: JSON.stringify({
      table: "tenants",
      action: "insert",
      data: {
        values: {
          name: tenant.name,
          address: tenant.companyAddress ?? null,
          contact_person: tenant.contactPerson,
          contact_email: tenant.contactEmail,
          contact_number: tenant.contactPhone,
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
    companyAddress: row.address,
    contactPerson: row.contact_person,
    contactEmail: row.contact_email,
    contactPhone: row.contact_number,
    status: row.status,
  };
}