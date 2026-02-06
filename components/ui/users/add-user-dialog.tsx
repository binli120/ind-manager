// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
'use client';

import type React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEffect, useState } from 'react';
import type { User, UserPrivilege, UserRole } from './users-page';
import { roleLabels } from './users-page';

type AddUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (user: Omit<User, 'id' | 'status'> & { password: string; privilege: UserPrivilege }) => void;
  companies: string[];
  currentUserPrivilege: UserPrivilege;
};

export function AddUserDialog({
  open,
  onOpenChange,
  onAdd,
  companies,
  currentUserPrivilege,
}: AddUserDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: '' as UserRole | '',
    privilege: '' as UserPrivilege | '',
    company: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      formData.name &&
      formData.email &&
      formData.password &&
      formData.phone &&
      formData.role &&
      formData.privilege &&
      formData.company
    ) {
      onAdd({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: formData.role as UserRole,
        privilege: formData.privilege as UserPrivilege,
        company: formData.company,
      });
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: '',
        privilege: '',
        company: '',
      });
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      role: '',
      privilege: '',
      company: '',
    });
    onOpenChange(false);
  };

  const coreRegulatoryRoles: UserRole[] = [
    'reg_affairs_manager_lead',
    'regulatory_writer_medical_writer',
    'ectd_publishing_specialist',
  ];

  const scientificClinicalRoles: UserRole[] = [
    'clinical_development_lead',
    'medical_monitor',
    'nonclinical_toxicology_lead',
    'cmc_lead',
  ];

  const supportingRoles: UserRole[] = [
    'quality_assurance',
    'project_manager',
    'data_manager_biostatistician',
    'document_management_specialist',
  ];

  useEffect(() => {
    if (open) {
      const randomPass = crypto.randomUUID().slice(0, 12);
      setFormData((prev) => ({ ...prev, password: randomPass }));
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Enter the user details below. The user will be created with pending
            status.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='name'>Name</Label>
              <Input
                id='name'
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder='Enter name'
                required
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder='Enter email address'
                required
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='password'>Password</Label>
              <Input
                id='password'
                type='text'
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder='Enter password'
                required
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='phone'>Phone</Label>
              <Input
                id='phone'
                type='tel'
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder='Enter phone number'
                required
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='company'>Company</Label>
              <Select
                value={formData.company}
                onValueChange={(value) =>
                  setFormData({ ...formData, company: value })
                }
              >
                <SelectTrigger id='company'>
                  <SelectValue placeholder='Select a company' />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company} value={company}>
                      {company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='role'>Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value as UserRole })
                }
              >
                <SelectTrigger id='role'>
                  <SelectValue placeholder='Select a role' />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Core Regulatory Roles</SelectLabel>
                    {coreRegulatoryRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {roleLabels[role]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Scientific/Clinical Roles</SelectLabel>
                    {scientificClinicalRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {roleLabels[role]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Supporting Roles</SelectLabel>
                    {supportingRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {roleLabels[role]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='privilege'>Privilege</Label>
              <Select
                value={formData.privilege}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    privilege: value as UserPrivilege,
                  })
                }
              >
                <SelectTrigger id='privilege'>
                  <SelectValue placeholder='Select a privilege' />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {currentUserPrivilege === 'system_admin' && (
                      <SelectItem value='system_admin'>System Admin</SelectItem>
                    )}
                    <SelectItem value='user_manager'>User Manager</SelectItem>
                    <SelectItem value='user'>User</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={handleCancel}>
              Cancel
            </Button>
            <Button type='submit'>Add User</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
