// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

export type Tenant = {
  id: string;
  name: string;
  companyAddress: string | null;
  contactPerson: string | null;
  contactEmail: string | null;
  contactPhone: string | number | null;
  status: 'active' | 'inactive' | 'pending';
};

export type TenantCreateInput = {
  name: string;
  companyAddress?: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
};
