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
import { AddUserDialog } from './add-user-dialog';
import { fetchUsers, updateUserStatus, createUser, fetchCurrentUser } from "@/lib/supabase/users";
import { fetchTenants } from "@/lib/supabase/tenants";
import { authServices } from "@/app/api/auth/auth-services";

//These should be made more robust in the future.
export type UserRole =
  | 'reg_affairs_manager_lead'
  | 'regulatory_writer_medical_writer'
  | 'ectd_publishing_specialist'
  | 'clinical_development_lead'
  | 'medical_monitor'
  | 'nonclinical_toxicology_lead'
  | 'cmc_lead'
  | 'quality_assurance'
  | 'project_manager'
  | 'data_manager_biostatistician'
  | 'document_management_specialist';

export type UserPrivilege = 'system_admin' | 'user_manager' | 'user';

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  company: string;
  status: 'active' | 'inactive' | 'pending';
};

export type Tenant = {
  id: string;
  name: string;
};

export const roleLabels: Record<UserRole, string> = {
  reg_affairs_manager_lead: 'Regulatory Affairs Manager/Lead',
  regulatory_writer_medical_writer: 'Regulatory Writer/Medical Writer',
  ectd_publishing_specialist: 'eCTD Publishing Specialist',
  clinical_development_lead: 'Clinical Development Lead',
  medical_monitor: 'Medical Monitor',
  nonclinical_toxicology_lead: 'Nonclinical/Toxicology Lead',
  cmc_lead: 'CMC Lead',
  quality_assurance: 'Quality Assurance',
  project_manager: 'Project Manager',
  data_manager_biostatistician: 'Data Manager/Biostatistician',
  document_management_specialist: 'Document Management Specialist',
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive' | 'pending'
  >('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [companies, setCompanies] = useState<string[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentUserPrivilege, setCurrentUserPrivilege] = useState<UserPrivilege>('');

  useEffect(() => {
    initializeUserData();
  }, []);

  async function initializeUserData() {
      //Get the currently logged in user ID
      const authData = await authServices.getUser();
      const authUser = authData.data?.user;
      if (!authUser) return;
      const privilege =(authUser?.user_metadata?.privilege as UserPrivilege) ?? 'system_admin';
      setCurrentUserPrivilege(privilege);

      //Get the logged in user's tenantid and fetch 
      const currentUserDbRecord = await fetchCurrentUser(authUser.id);
      if (privilege === 'system_admin') {
        fetchUsers().then(setUsers);
      } else if (currentUserDbRecord?.tenantid) {
        fetchUsers(currentUserDbRecord.tenantid).then(setUsers);
      } else {
        setUsers([]);
      }

      //To fill companies
      if (privilege === 'system_admin') {
        fetchTenants().then((data) => {
          setTenants(data);
          setCompanies(data.map((t) => t.name));
        });
      } else if (currentUserDbRecord?.tenantid) {
        fetchTenants(currentUserDbRecord.tenantid).then((data) => {
          setTenants(data);
          setCompanies(data.map((t) => t.name));
        });
      } else {
        setTenants([]);
        setCompanies([]);
      }
    }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      //Should make it so that names can't be null in Supabase eventually
      (user.name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      roleLabels[user.role].toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleToggleStatus = async (userId: string) => {
    const u = users.find((x) => x.id === userId);
    if (!u) return;

    const next = u.status === "active" ? "inactive" : "active";
    const updated = await updateUserStatus(userId, next);

    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId
          ? { ...updated }
          : user
      )
    );
  };

  const handleAddUser = async (formUser: {
    name: string;
    email: string;
    password: string;
    phone: string;
    role: UserRole;
    privilege: UserPrivilege;
    company: string;
  }) => {

    const { data: signUpData, error: authError } = await authServices.signUp(
      formUser.email,
      formUser.password,
      {
        name: formUser.name,
        privilege: formUser.privilege,
      }
    );

    if (authError || !signUpData?.user) {
      console.error("signup failed or no user returned:", authError);
      return;
    }

    const authUser = signUpData.user;
    const selectedTenant = tenants.find(t => t.name === formUser.company);
    if (!selectedTenant) {
      console.error("Selected company not found in tenants list");
      return;
    }

    const user = await createUser({
      id: authUser.id, // foreign key → auth.users.id
      name: formUser.name,
      email: formUser.email,
      phone: formUser.phone,
      role: formUser.role,
      tenantId: selectedTenant.id,
    });
    setUsers((prevUsers) => [...prevUsers, user]);

    await authServices.resetPassword(formUser.email);
  };

  return (
    <div className='flex-1 overflow-y-auto bg-gray-50/50'>
      {/* Header */}
      <div className='bg-background border-b border-border px-8 py-6'>
        <div className='flex items-start justify-between mb-6'>
          <div>
            <h1 className='text-3xl font-bold text-foreground mb-2'>
              Users Management
            </h1>
            <p className='text-muted-foreground text-lg'>
              Manage user accounts and roles
            </p>
          </div>

          <Button
            className='bg-purple-600 text-white hover:bg-purple-700 shadow-sm'
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className='w-4 h-4 mr-2' />
            Add User
          </Button>
        </div>

        {/* Filters and Search */}
        <div className='flex items-center justify-between gap-4'>
          <div className='flex items-center gap-4 flex-1'>
            <div className='relative max-w-md'>
              <SearchIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted' />
              <Input
                placeholder='Search users...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10 bg-background border-border shadow-sm'
              />
            </div>

            <Tabs
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as any)}
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

      {/* Users Table */}
      <div className='p-8'>
        <div className='rounded-lg border'>
          <Table>
            <TableHeader className='bg-muted'>
              <TableRow className='hover:bg-muted'>
                <TableHead className='font-semibold text-foreground'>
                  Name
                </TableHead>
                <TableHead className='font-semibold text-foreground'>
                  Company
                </TableHead>
                <TableHead className='font-semibold text-foreground'>
                  Email
                </TableHead>
                <TableHead className='font-semibold text-foreground'>
                  Phone
                </TableHead>
                <TableHead className='font-semibold text-foreground'>
                  Role
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
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className='h-24 text-center'>
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user, index) => (
                  <TableRow
                    key={user.id}
                    className={
                      index % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                    }
                  >
                    <TableCell className='font-medium'>{user.name}</TableCell>
                    <TableCell>{user.company}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>
                      <span className='text-sm'>{roleLabels[user.role]}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.status === 'active'
                            ? 'default'
                            : user.status === 'pending'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right'>
                      {user.status !== 'pending' && (
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleToggleStatus(user.id)}
                        >
                          {user.status === 'active' ? 'Deactivate' : 'Activate'}
                        </Button>
                      )}
                      {user.status === 'pending' && (
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleToggleStatus(user.id)}
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

      <AddUserDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={handleAddUser}
        companies={companies}
        currentUserPrivilege={currentUserPrivilege}
      />
    </div>
  );
}
