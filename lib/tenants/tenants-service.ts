// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import {
  createTenant as createTenantRecord,
  fetchTenants as fetchTenantRecords,
  updateTenantStatus as updateTenantStatusRecord,
} from '@/lib/supabase/tenants';
import type { Tenant, TenantCreateInput } from '@/lib/tenants/types';

export async function fetchTenants(tenantId?: string): Promise<Tenant[]> {
  return fetchTenantRecords(tenantId);
}

export async function updateTenantStatus(id: string, status: string): Promise<Tenant> {
  return updateTenantStatusRecord(id, status);
}

export async function createTenant(tenant: TenantCreateInput): Promise<Tenant> {
  return createTenantRecord(tenant);
}
