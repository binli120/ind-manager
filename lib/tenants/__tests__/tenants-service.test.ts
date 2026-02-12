// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import {
  createTenant as createTenantRecord,
  fetchTenants as fetchTenantRecords,
  updateTenantStatus as updateTenantStatusRecord,
} from '@/lib/supabase/tenants';
import { createTenant, fetchTenants, updateTenantStatus } from '@/lib/tenants/tenants-service';

jest.mock('@/lib/supabase/tenants', () => ({
  fetchTenants: jest.fn(),
  updateTenantStatus: jest.fn(),
  createTenant: jest.fn(),
}));

describe('lib/tenants/tenants-service', () => {
  beforeEach(() => {
    (fetchTenantRecords as jest.Mock).mockReset();
    (updateTenantStatusRecord as jest.Mock).mockReset();
    (createTenantRecord as jest.Mock).mockReset();
  });

  it('delegates fetchTenants', async () => {
    const expected = [{ id: 't1', name: 'Acme' }];
    (fetchTenantRecords as jest.Mock).mockResolvedValue(expected);

    const result = await fetchTenants('tenant-1');

    expect(fetchTenantRecords).toHaveBeenCalledWith('tenant-1');
    expect(result).toBe(expected);
  });

  it('delegates updateTenantStatus', async () => {
    const expected = { id: 't1', status: 'inactive' };
    (updateTenantStatusRecord as jest.Mock).mockResolvedValue(expected);

    const result = await updateTenantStatus('t1', 'inactive');

    expect(updateTenantStatusRecord).toHaveBeenCalledWith('t1', 'inactive');
    expect(result).toBe(expected);
  });

  it('delegates createTenant', async () => {
    const payload = {
      name: 'Acme',
      companyAddress: '123 St',
      contactPerson: 'Alice',
      contactEmail: 'alice@example.com',
      contactPhone: '123',
    };
    const expected = { id: 't2', ...payload, status: 'pending' };
    (createTenantRecord as jest.Mock).mockResolvedValue(expected);

    const result = await createTenant(payload);

    expect(createTenantRecord).toHaveBeenCalledWith(payload);
    expect(result).toBe(expected);
  });
});
