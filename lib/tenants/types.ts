// Author: Bin Lee
// Email: binlee120@gmail.com

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
