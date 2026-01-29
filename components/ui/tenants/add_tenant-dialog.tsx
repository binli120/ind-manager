// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
'use client';

import type React from 'react';

import type { Tenant } from './tenants-page';
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
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

type AddTenantDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (tenant: Omit<Tenant, 'id' | 'status'>) => void;
};

export function AddTenantDialog({
  open,
  onOpenChange,
  onAdd,
}: AddTenantDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    companyAddress: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    // Reset form
    setFormData({
      name: '',
      companyAddress: '',
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
    });
    onOpenChange(false);
  };

  const handleCancel = () => {
    // Reset form on cancel
    setFormData({
      name: '',
      companyAddress: '',
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[525px]'>
        <DialogHeader>
          <DialogTitle>Add New Tenant</DialogTitle>
          <DialogDescription>
            Enter the tenant information below. The tenant will be created with
            a pending status.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='name'>Tenant Name</Label>
              <Input
                id='name'
                placeholder='Enter tenant name'
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='companyAddress'>Company Address</Label>
              <Textarea
                id='companyAddress'
                placeholder='Enter company address'
                value={formData.companyAddress}
                onChange={(e) =>
                  setFormData({ ...formData, companyAddress: e.target.value })
                }
                required
                rows={3}
                className='resize-none'
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='contactPerson'>Contact Person</Label>
              <Input
                id='contactPerson'
                placeholder='Enter contact person name'
                value={formData.contactPerson}
                onChange={(e) =>
                  setFormData({ ...formData, contactPerson: e.target.value })
                }
                required
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='contactEmail'>Contact Email</Label>
              <Input
                id='contactEmail'
                type='email'
                placeholder='Enter contact email'
                value={formData.contactEmail}
                onChange={(e) =>
                  setFormData({ ...formData, contactEmail: e.target.value })
                }
                required
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='contactPhone'>Contact Phone</Label>
              <Input
                id='contactPhone'
                type='tel'
                placeholder='Enter contact phone'
                value={formData.contactPhone}
                onChange={(e) =>
                  setFormData({ ...formData, contactPhone: e.target.value })
                }
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={handleCancel}>
              Cancel
            </Button>
            <Button type='submit'>Add Tenant</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
