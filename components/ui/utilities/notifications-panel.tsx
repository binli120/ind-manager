'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Building2,
  CheckCircle2,
  Clock,
  FolderKanban,
  Globe,
  Send,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';

const tenantsList = [
  { id: 'acme', name: 'Acme Corporation' },
  { id: 'testco', name: 'Test Company' },
  { id: 'filynai', name: 'filynai.com' },
  { id: 'pharmagroup', name: 'PharmaGroup Inc.' },
  { id: 'biomed', name: 'BioMed Solutions' },
];

const projectsList = [
  { id: 'lpathomab', name: 'Lpathomab', tenant: 'filynai.com' },
  { id: 'neurofix', name: 'NeuroFix', tenant: 'Acme Corporation' },
  { id: 'cardiozen', name: 'CardioZen', tenant: 'Acme Corporation' },
  { id: 'oncovax', name: 'OncoVax', tenant: 'Test Company' },
  { id: 'rheumacure', name: 'RheumaCure', tenant: 'PharmaGroup Inc.' },
  { id: 'dermashield', name: 'DermaShield', tenant: 'BioMed Solutions' },
];

const recentNotifications = [
  {
    id: 1,
    title: 'System Maintenance Scheduled',
    audience: 'All Users',
    date: 'Feb 22, 2026',
    status: 'sent',
  },
  {
    id: 2,
    title: 'New Module: AI Analysis v2.0 Available',
    audience: 'Active Tenants',
    date: 'Feb 20, 2026',
    status: 'sent',
  },
  {
    id: 3,
    title: 'Submission Deadline Approaching',
    audience: 'Acme Corporation',
    date: 'Feb 18, 2026',
    status: 'sent',
  },
  {
    id: 4,
    title: 'Review Required for Lpathomab',
    audience: 'Project: Lpathomab',
    date: 'Feb 15, 2026',
    status: 'sent',
  },
];

export function NotificationsPanel() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('');
  const [priority, setPriority] = useState('');
  const [selectedTenant, setSelectedTenant] = useState('');
  const [selectedProject, setSelectedProject] = useState('');

  const filteredProjects = selectedTenant
    ? projectsList.filter(
        (p) =>
          p.tenant === tenantsList.find((t) => t.id === selectedTenant)?.name,
      )
    : projectsList;

  const needsTenantSelect = audience === 'specific-tenant';
  const needsProjectSelect = audience === 'specific-project';

  function handleAudienceChange(value: string) {
    setAudience(value);
    setSelectedTenant('');
    setSelectedProject('');
  }

  return (
    <div className='flex flex-col gap-6 lg:flex-row'>
      {/* Compose */}
      <div className='flex-1 rounded-lg border border-border bg-card p-6'>
        <div className='mb-5 flex items-center gap-2'>
          <div className='flex size-9 items-center justify-center rounded-lg bg-primary/10'>
            <Send className='size-4 text-primary' />
          </div>
          <div>
            <h3 className='text-sm font-semibold text-foreground'>
              Compose Notification
            </h3>
            <p className='text-xs text-muted-foreground'>
              Send system-wide alerts to users
            </p>
          </div>
        </div>

        <div className='flex flex-col gap-4'>
          <div>
            <label className='mb-1.5 block text-xs font-medium text-foreground'>
              Title
            </label>
            <Input
              placeholder='Enter notification title...'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className='bg-background'
            />
          </div>

          <div>
            <label className='mb-1.5 block text-xs font-medium text-foreground'>
              Message
            </label>
            <Textarea
              placeholder='Write your notification message...'
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className='min-h-28 resize-none bg-background'
            />
          </div>

          <div className='flex flex-col gap-4 sm:flex-row'>
            <div className='flex-1'>
              <label className='mb-1.5 block text-xs font-medium text-foreground'>
                Target Audience
              </label>
              <Select value={audience} onValueChange={handleAudienceChange}>
                <SelectTrigger className='w-full bg-background'>
                  <SelectValue placeholder='Select audience' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>
                    <Globe className='mr-1.5 inline size-3.5' />
                    All Users
                  </SelectItem>
                  <SelectItem value='active-tenants'>
                    <Building2 className='mr-1.5 inline size-3.5' />
                    All Active Tenants
                  </SelectItem>
                  <SelectItem value='admins'>
                    <Users className='mr-1.5 inline size-3.5' />
                    Admins Only
                  </SelectItem>
                  <SelectItem value='specific-tenant'>
                    <Building2 className='mr-1.5 inline size-3.5' />
                    Specific Tenant
                  </SelectItem>
                  <SelectItem value='specific-project'>
                    <FolderKanban className='mr-1.5 inline size-3.5' />
                    Specific Project
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='flex-1'>
              <label className='mb-1.5 block text-xs font-medium text-foreground'>
                Priority
              </label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className='w-full bg-background'>
                  <SelectValue placeholder='Select priority' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='low'>Low</SelectItem>
                  <SelectItem value='normal'>Normal</SelectItem>
                  <SelectItem value='high'>High</SelectItem>
                  <SelectItem value='urgent'>Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conditional: Specific Tenant selector */}
          {needsTenantSelect && (
            <div>
              <label className='mb-1.5 block text-xs font-medium text-foreground'>
                Select Tenant
              </label>
              <div className='flex items-center gap-2'>
                <Select
                  value={selectedTenant}
                  onValueChange={setSelectedTenant}
                >
                  <SelectTrigger className='w-full bg-background'>
                    <SelectValue placeholder='Choose a tenant...' />
                  </SelectTrigger>
                  <SelectContent>
                    {tenantsList.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <Building2 className='mr-1.5 inline size-3.5 text-muted-foreground' />
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTenant && (
                  <Button
                    variant='ghost'
                    size='icon'
                    className='size-8 shrink-0 text-muted-foreground hover:text-foreground'
                    onClick={() => setSelectedTenant('')}
                  >
                    <X className='size-3.5' />
                    <span className='sr-only'>Clear tenant selection</span>
                  </Button>
                )}
              </div>
              {selectedTenant && (
                <p className='mt-1.5 text-xs text-muted-foreground'>
                  Notification will be sent to all users in{' '}
                  <span className='font-medium text-foreground'>
                    {tenantsList.find((t) => t.id === selectedTenant)?.name}
                  </span>
                </p>
              )}
            </div>
          )}

          {/* Conditional: Specific Project selector */}
          {needsProjectSelect && (
            <div className='flex flex-col gap-4 sm:flex-row'>
              <div className='flex-1'>
                <label className='mb-1.5 block text-xs font-medium text-foreground'>
                  Filter by Tenant (optional)
                </label>
                <Select
                  value={selectedTenant}
                  onValueChange={(v) => {
                    setSelectedTenant(v);
                    setSelectedProject('');
                  }}
                >
                  <SelectTrigger className='w-full bg-background'>
                    <SelectValue placeholder='All tenants' />
                  </SelectTrigger>
                  <SelectContent>
                    {tenantsList.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <Building2 className='mr-1.5 inline size-3.5 text-muted-foreground' />
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='flex-1'>
                <label className='mb-1.5 block text-xs font-medium text-foreground'>
                  Select Project
                </label>
                <div className='flex items-center gap-2'>
                  <Select
                    value={selectedProject}
                    onValueChange={setSelectedProject}
                  >
                    <SelectTrigger className='w-full bg-background'>
                      <SelectValue placeholder='Choose a project...' />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredProjects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <FolderKanban className='mr-1.5 inline size-3.5 text-muted-foreground' />
                          {p.name}
                          <span className='ml-1.5 text-muted-foreground'>
                            ({p.tenant})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedProject && (
                    <Button
                      variant='ghost'
                      size='icon'
                      className='size-8 shrink-0 text-muted-foreground hover:text-foreground'
                      onClick={() => setSelectedProject('')}
                    >
                      <X className='size-3.5' />
                      <span className='sr-only'>Clear project selection</span>
                    </Button>
                  )}
                </div>
                {selectedProject && (
                  <p className='mt-1.5 text-xs text-muted-foreground'>
                    Notification will be sent to all members of{' '}
                    <span className='font-medium text-foreground'>
                      {projectsList.find((p) => p.id === selectedProject)?.name}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          <div className='flex items-center justify-end gap-2 pt-2'>
            <Button variant='outline' size='sm'>
              <Clock className='mr-1.5 size-3.5' />
              Schedule
            </Button>
            <Button
              size='sm'
              className='bg-primary text-primary-foreground hover:bg-primary/90'
            >
              <Send className='mr-1.5 size-3.5' />
              Send Now
            </Button>
          </div>
        </div>
      </div>

      {/* Recent Notifications */}
      <div className='w-full rounded-lg border border-border bg-card p-6 lg:w-96'>
        <h3 className='mb-4 text-sm font-semibold text-foreground'>
          Recent Notifications
        </h3>
        <div className='flex flex-col gap-3'>
          {recentNotifications.map((n) => (
            <div
              key={n.id}
              className='rounded-md border border-border bg-background p-3'
            >
              <div className='mb-1.5 flex items-start justify-between gap-2'>
                <p className='text-sm font-medium text-foreground leading-snug'>
                  {n.title}
                </p>
                <Badge
                  variant='secondary'
                  className='shrink-0 bg-emerald-50 text-emerald-700 border-emerald-200'
                >
                  <CheckCircle2 className='mr-1 size-3' />
                  {n.status}
                </Badge>
              </div>
              <div className='flex items-center gap-3 text-xs text-muted-foreground'>
                <span className='flex items-center gap-1'>
                  <Users className='size-3' />
                  {n.audience}
                </span>
                <span>{n.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
