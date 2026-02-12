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
import { AddUserDialog } from './add-user-dialog';
import { AssignProjectDialog } from './assign-project-dialog';
import { useUsersPageController } from '@/hooks/useUsersPageController';
import { roleLabels } from '@/lib/users/types';

export default function UsersPage() {
  const {
    filteredUsers,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    isAddDialogOpen,
    setIsAddDialogOpen,
    companies,
    currentUserPrivilege,
    isAssignDialogOpen,
    setIsAssignDialogOpen,
    selectedUserForAssignment,
    availableProjects,
    handleToggleStatus,
    handleAddUser,
    handleAssignProjects,
  } = useUsersPageController();

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
