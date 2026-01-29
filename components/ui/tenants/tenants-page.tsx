// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, SearchIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AddTenantDialog } from './add_tenant-dialog';
import { fetchTenants, updateTenantStatus, createTenant } from "@/lib/supabase";

export type Tenant = {
  id: string;
  name: string;
  companyAddress: string | null;
  contactPerson: string | null;
  contactEmail: string | null;
  contactPhone: string | number | null;
  status: 'active' | 'inactive' | 'pending';
};

type TenantInput = {
  id?: string;
  name: string;
  companyAddress?: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  status?: string;
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive' | 'pending'
  >('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    fetchTenants().then(setTenants);
  }, []);

  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tenant.contactPerson ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tenant.contactEmail ?? "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || tenant.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleToggleStatus = async (tenantId: string) => {
    const updated = await updateTenantStatus(tenantId, (tenants.find(t => t.id === tenantId)?.status === "active" ? "inactive" : "active"));

    setTenants((prevTenants) =>
      prevTenants.map((tenant) =>
        tenant.id === tenantId
          ? {
              ...tenant,
              ...updated,
              companyAddress: updated?.companyAddress ?? tenant.companyAddress ?? "",
              contactPerson: updated?.contactPerson ?? tenant.contactPerson ?? "",
              contactEmail: updated?.contactEmail ?? tenant.contactEmail ?? "",
              contactPhone: updated?.contactPhone?.toString() ?? tenant.contactPhone ?? "",
              status: (updated?.status ?? tenant.status) as Tenant["status"],
            }
          : tenant
      )
    );
  };

  const handleAddTenant = async (newTenant: Omit<Tenant, "id" | "status">) => {
    const payload: TenantInput = {
      id: "",
      name: newTenant.name,
      companyAddress: newTenant.companyAddress ?? "",
      contactPerson: newTenant.contactPerson ?? "",
      contactEmail: newTenant.contactEmail ?? "",
      contactPhone: (newTenant.contactPhone ?? "").toString(),
      status: "pending",
    };
    const tenant = await createTenant(payload);
    const t = tenant as Partial<Tenant> & {
      companyAddress?: string | null;
      contactPerson?: string | null;
      contactEmail?: string | null;
      contactPhone?: string | number | null;
      status?: Tenant["status"];
    };
    const normalized: Tenant = {
      id: t.id ?? "",
      name: t.name ?? "",
      companyAddress: t.companyAddress ?? "",
      contactPerson: t.contactPerson ?? "",
      contactEmail: t.contactEmail ?? "",
      contactPhone: t.contactPhone?.toString() ?? "",
      status: t.status ?? "pending",
    };
    setTenants(prev => [...prev, normalized]);
  };

  return (
    <div className='flex-1 overflow-y-auto bg-gray-50/50'>
      {/* Header */}
      <div className='bg-background border-b border-border px-8 py-6'>
        <div className='flex items-start justify-between mb-6'>
          <div>
            <h1 className='text-3xl font-bold text-foreground mb-2'>
              Tenants Management
            </h1>
            <p className='text-muted-foreground text-lg'>
              Manage and monitor all tenant accounts
            </p>
          </div>

          <Button
            className='bg-purple-600 text-white hover:bg-purple-700 shadow-sm'
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className='w-4 h-4 mr-2' />
            Add Tenant
          </Button>
        </div>

        {/* Filters and Search */}
        <div className='flex items-center justify-between gap-4'>
          <div className='flex items-center gap-4 flex-1'>
            <div className='relative max-w-md'>
              <SearchIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted' />
              <Input
                placeholder='Search tenants...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10 bg-background border-border shadow-sm'
              />
            </div>

            <Tabs
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as 'all' | 'active' | 'inactive' | 'pending')}
            >
              <TabsList>
                <TabsTrigger value='all'>All</TabsTrigger>
                <TabsTrigger value='active'>Active</TabsTrigger>
                <TabsTrigger value='inactive'>Inactive</TabsTrigger>
                <TabsTrigger value='pending'>Pending</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Tenants Table */}
      <div className='p-8'>
        <div className='rounded-lg border'>
          <Table>
            <TableHeader className='bg-muted'>
              <TableRow className='hover:bg-muted'>
                <TableHead className='font-semibold text-foreground'>
                  Name
                </TableHead>
                <TableHead className='font-semibold text-foreground'>
                  Company Address
                </TableHead>
                <TableHead className='font-semibold text-foreground'>
                  Contact Person
                </TableHead>
                <TableHead className='font-semibold text-foreground'>
                  Contact Email
                </TableHead>
                <TableHead className='font-semibold text-foreground'>
                  Contact Phone
                </TableHead>
                <TableHead className='font-semibold text-foreground'>
                  Status
                </TableHead>
                <TableHead className='text-right font-semibold text-foreground'>
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className='h-24 text-center'>
                    No tenants found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTenants.map((tenant, index) => (
                  <TableRow
                    key={tenant.id}
                    className={
                      index % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                    }
                  >
                    <TableCell className='font-medium'>{tenant.name}</TableCell>
                    <TableCell className='max-w-[200px]'>
                      <div className='whitespace-pre-line text-sm leading-relaxed'>
                        {tenant.companyAddress}
                      </div>
                    </TableCell>
                    <TableCell>{tenant.contactPerson}</TableCell>
                    <TableCell>{tenant.contactEmail}</TableCell>
                    <TableCell>{tenant.contactPhone}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          tenant.status === 'active'
                            ? 'default'
                            : tenant.status === 'pending'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {tenant.status}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right'>
                      {tenant.status !== 'pending' && (
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleToggleStatus(tenant.id)}
                        >
                          {tenant.status === 'active'
                            ? 'Deactivate'
                            : 'Activate'}
                        </Button>
                      )}
                      {tenant.status === 'pending' && (
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleToggleStatus(tenant.id)}
                        >
                          Activate
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AddTenantDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={handleAddTenant}
      />
    </div>
  );
}
