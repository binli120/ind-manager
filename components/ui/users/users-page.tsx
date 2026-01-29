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
import { Plus, SearchIcon, FolderGit2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AddUserDialog } from './add-user-dialog';
import { fetchUsers, updateUserStatus, createUser, fetchTenants } from "@/lib/supabase";
import { authServices } from "@/app/api/auth/auth-services";
import { AssignProjectDialog } from './assign-project-dialog';
import { fetchProjects } from "@/lib/supabase/projects";
import type { Project } from "@/lib/store/slices/projectsSlice";

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
  privilege?: UserPrivilege;
  password?: string;
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
  const [currentUserPrivilege, setCurrentUserPrivilege] = useState<UserPrivilege>('user');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedUserForAssignment, setSelectedUserForAssignment] = useState<User | null>(null);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);

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

      const targetTenantId: string | undefined = undefined;

      fetchUsers(targetTenantId).then(setUsers);
      fetchProjects(targetTenantId).then((data) => setAvailableProjects(data as unknown as Project[]));

      fetchTenants(targetTenantId).then((data) => {
        setTenants(data);
        setCompanies(data.map((t) => t.name));
      });
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
          ? {
              ...user,
              ...updated,
              phone: (updated?.phone ?? user.phone ?? "").toString(),
              status: (updated?.status as User["status"]) ?? user.status,
            }
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

    const { error: authError } = await authServices.signUp(
      formUser.email,
      formUser.password,
      {
        name: formUser.name,
        privilege: formUser.privilege,
      }
    );

    if (authError) {
      console.error("signup failed:", authError);
      return;
    }

    const selectedTenant = tenants.find(t => t.name === formUser.company);
    if (!selectedTenant) {
      console.error("Selected company not found in tenants list");
      return;
    }

    const authUserId = `user-${Date.now()}`;
    const user = await createUser({
      id: authUserId, // placeholder id; replace with auth user id when available
      name: formUser.name,
      email: formUser.email,
      phone: formUser.phone,
      role: formUser.role,
      tenantId: selectedTenant.id,
    });
    const u = user as Partial<User>;
    const normalizedUser: User = {
      ...user,
      phone: (u.phone ?? "").toString(),
      privilege: u.privilege ?? (formUser.privilege as UserPrivilege),
      status: (u.status as User["status"]) ?? "pending",
    };
    setUsers((prevUsers) => [...prevUsers, normalizedUser]);

    await authServices.resetPassword(formUser.email);
  };

  const handleAssignProjects = (user: User) => {
    setSelectedUserForAssignment(user);
    setIsAssignDialogOpen(true);
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
                      <div className="flex justify-end gap-2">
                        {user.status === 'active' && (
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleAssignProjects(user)}
                            title="Assign Projects"
                          >
                            <FolderGit2 className="h-4 w-4" />
                          </Button>
                        )}
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
                      </div>
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

      <AssignProjectDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        user={selectedUserForAssignment}
        projects={availableProjects}
      />
    </div>
  );
}
