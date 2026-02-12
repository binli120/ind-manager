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
import { formatPhoneNumberInput, isPhoneNumberValid } from '@/lib/users/phone';
import { useState } from 'react';
import type { AddUserInput, UserPrivilege, UserRole } from '@/lib/users/types';
import {
  coreRegulatoryRoles,
  roleLabels,
  scientificClinicalRoles,
  supportingRoles,
} from '@/lib/users/types';

type AddUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (user: AddUserInput) => Promise<void> | void;
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
    phone: '',
    role: '' as UserRole | '',
    privilege: '' as UserPrivilege | '',
    company: '',
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requiresTenant = formData.privilege !== 'system_admin';
  const hasPhone = Boolean(formData.phone);
  const phoneValid = isPhoneNumberValid(formData.phone);
  const canSubmit =
    Boolean(formData.name) &&
    Boolean(formData.email) &&
    Boolean(formData.phone) &&
    Boolean(formData.role) &&
    Boolean(formData.privilege) &&
    (!requiresTenant || Boolean(formData.company)) &&
    phoneValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!canSubmit) {
      if (hasPhone && !phoneValid) {
        setSubmitError('Phone number must be in xxx-xxx-xxxx format.');
      }
      return;
    }

    try {
      setIsSubmitting(true);
      await onAdd({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role as UserRole,
        privilege: formData.privilege as UserPrivilege,
        company: formData.company,
      });
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: '',
        privilege: '',
        company: '',
      });
      onOpenChange(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: '',
      privilege: '',
      company: '',
    });
    setSubmitError(null);
    onOpenChange(false);
  };

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
              <Label htmlFor='phone'>Phone</Label>
              <Input
                id='phone'
                type='tel'
                value={formData.phone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    phone: formatPhoneNumberInput(e.target.value),
                  })
                }
                placeholder='xxx-xxx-xxxx'
                required
              />
              {hasPhone && !phoneValid && (
                <p className='text-xs text-red-500'>
                  Enter a valid phone number (xxx-xxx-xxxx).
                </p>
              )}
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='company'>
                Tenant
                {formData.privilege !== 'system_admin' ? ' *' : ''}
              </Label>
              <Select
                value={formData.company}
                onValueChange={(value) =>
                  setFormData({ ...formData, company: value })
                }
              >
                <SelectTrigger id='company'>
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
              {formData.privilege === 'system_admin' && (
                <p className='text-xs text-muted-foreground'>
                  Optional for system admin users.
                </p>
              )}
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
            {submitError && <p className='text-sm text-red-500'>{submitError}</p>}
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={handleCancel}>
              Cancel
            </Button>
            <Button type='submit' disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
