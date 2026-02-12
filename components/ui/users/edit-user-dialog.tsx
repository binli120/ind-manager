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
import {
  coreRegulatoryRoles,
  roleLabels,
  scientificClinicalRoles,
  supportingRoles,
  type EditUserInput,
  type User,
  type UserRole,
} from '@/lib/users/types';
import { useEffect, useState } from 'react';

type EditUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (user: EditUserInput) => Promise<void> | void;
  companies: string[];
  user: User | null;
  isSaving?: boolean;
};

export function EditUserDialog({
  open,
  onOpenChange,
  onSave,
  companies,
  user,
  isSaving = false,
}: EditUserDialogProps) {
  const [formData, setFormData] = useState<EditUserInput>({
    name: '',
    email: '',
    phone: '',
    role: coreRegulatoryRoles[0],
    company: '',
  });

  useEffect(() => {
    if (!user || !open) return;
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      company: user.company,
    });
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim() ||
      !formData.role ||
      !formData.company
    ) {
      return;
    }

    await onSave({
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      role: formData.role,
      company: formData.company,
    });
  };

  const handleCancel = () => {
    if (isSaving) return;
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user profile fields and save changes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='edit-name'>Name</Label>
              <Input
                id='edit-name'
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder='Enter name'
                required
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='edit-email'>Email</Label>
              <Input
                id='edit-email'
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
              <Label htmlFor='edit-phone'>Phone</Label>
              <Input
                id='edit-phone'
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
              <Label htmlFor='edit-company'>Tenant</Label>
              <Select
                value={formData.company}
                onValueChange={(value) =>
                  setFormData({ ...formData, company: value })
                }
              >
                <SelectTrigger id='edit-company'>
                  <SelectValue placeholder='Select a tenant' />
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
              <Label htmlFor='edit-role'>Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value as UserRole })
                }
              >
                <SelectTrigger id='edit-role'>
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
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={handleCancel}>
              Cancel
            </Button>
            <Button type='submit' disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
