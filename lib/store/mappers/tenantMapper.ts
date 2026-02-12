export type TenantRow = {
  id: string;
  name: string;
  address?: string | null;
  contact_person?: string | null;
  contact_email?: string | null;
  contact_number?: string | null;
  owner_user_id?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  metadata?: unknown;
};

export type Tenant = {
  id: string;
  name: string;
  address: string | null;
  contactPerson: string | null;
  contactEmail: string | null;
  contactNumber: string | null;
  status: string | null;
  ownerUserId: string | null;
  metadata: TenantRow["metadata"];
  createdAt: string | null;
};

export const mapTenantRowToTenant = (row: TenantRow): Tenant => ({
  id: row.id,
  name: row.name,
  address: row.address ?? null,
  contactPerson: row.contact_person ?? null,
  contactEmail: row.contact_email ?? null,
  contactNumber: row.contact_number ?? null,
  status: row.status ?? null,
  ownerUserId: row.owner_user_id ?? null,
  metadata: row.metadata,
  createdAt: row.created_at ?? null,
});

export const mapTenantRowsToTenants = (rows: TenantRow[]) =>
  rows.map(mapTenantRowToTenant);
