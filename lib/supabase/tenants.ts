// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import type { Tenant } from '@/lib/tenants/types';

type TenantRow = {
  id: string;
  name: string;
  address: string | null;
  contact_person: string | null;
  contact_email: string | null;
  contact_number: string | number | null;
  status: string;
};

const ADMIN_PROXY_ENDPOINT = "/api/admin/proxy";

const asJson = async <T>(res: Response) => {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || "Request failed");
  }
  return (await res.json()) as T;
};

export async function fetchTenants(tenantId?: string): Promise<Tenant[]> {
  const res = await fetch(ADMIN_PROXY_ENDPOINT, {
    method: "POST",
    body: JSON.stringify({
      table: "tenants",
      action: "select",
      data: { select: "*" },
      ...(tenantId ? { filters: { id: tenantId } } : {}),
    }),
  });

  const { data } = await asJson<{ data: TenantRow[] }>(res);

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    companyAddress: row.address ?? "",
    contactPerson: row.contact_person ?? "",
    contactEmail: row.contact_email ?? "",
    contactPhone: row.contact_number?.toString() ?? "",
    status: (row.status as Tenant["status"]) ?? "pending",
  }));
}

export async function updateTenantStatus(id: string, status: string) {
  const res = await fetch(ADMIN_PROXY_ENDPOINT, {
    method: "POST",
    body: JSON.stringify({
      table: "tenants",
      action: "update",
      data: { values: { status } },
      filters: { id },
    }),
  });

  const { data } = await asJson<{ data: TenantRow[] }>(res);
  const row = data[0];

  return {
    id: row.id,
    name: row.name,
    companyAddress: row.address,
    contactPerson: row.contact_person,
    contactEmail: row.contact_email,
    contactPhone: row.contact_number,
    status: (row.status as Tenant["status"]) ?? "pending",
  };
}

export async function createTenant(tenant: {
  name: string;
  companyAddress?: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
}) {
  const res = await fetch(ADMIN_PROXY_ENDPOINT, {
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

  const { data } = await asJson<{ data: TenantRow[] }>(res);
  const row = data[0];

  return {
    id: row.id,
    name: row.name,
    companyAddress: row.address,
    contactPerson: row.contact_person,
    contactEmail: row.contact_email,
    contactPhone: row.contact_number,
    status: (row.status as Tenant["status"]) ?? "pending",
  };
}
