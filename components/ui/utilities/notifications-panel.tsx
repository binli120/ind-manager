'use client';

import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  type DispatchNotificationRequest,
  NotificationScope,
  NotificationSourceType,
  NotificationType,
} from '@/lib/notifications/types';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { sendNotification } from '@/lib/store/slices/notificationsSlice';
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

type NotificationEventTemplate = {
  id: string;
  name: string;
  title: string;
  message: string;
};

type RecentNotification = {
  id: number;
  title: string;
  audience: string;
  date: string;
  status: 'sent' | 'scheduled';
  request?: DispatchNotificationRequest;
};

function mapPriorityToSeverity(priority: string): string {
  if (priority === 'urgent') return 'critical';
  return 'info';
}

const eventTemplates: NotificationEventTemplate[] = [
  {
    id: 'system-maintenance',
    name: 'System Maintenance',
    title: 'System Maintenance Scheduled',
    message:
      'We will perform scheduled maintenance on IND Manager this evening. You may experience short periods of downtime during the maintenance window.',
  },
  {
    id: 'feature-release',
    name: 'New Feature Release',
    title: 'New Feature Available',
    message:
      'A new feature has been released. Visit the workspace to review what changed and start using the update today.',
  },
  {
    id: 'deadline-reminder',
    name: 'Submission Deadline Reminder',
    title: 'Submission Deadline Approaching',
    message:
      'This is a reminder that a key submission deadline is approaching. Please review your outstanding tasks and complete required updates.',
  },
  {
    id: 'policy-update',
    name: 'Policy Update',
    title: 'Policy and Compliance Update',
    message:
      'We updated platform policy and compliance requirements. Please review the latest guidance to ensure your project remains aligned.',
  },
];

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

const recentNotifications: RecentNotification[] = [
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
  const dispatch = useAppDispatch();
  const currentUserId = useAppSelector((state) => state.auth.user?.id);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('all');
  const [priority, setPriority] = useState('normal');
  const [selectedTenant, setSelectedTenant] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [pendingActionId, setPendingActionId] = useState<number | null>(null);
  const [isSendConfirmOpen, setIsSendConfirmOpen] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sentNotifications, setSentNotifications] = useState(recentNotifications);

  const filteredProjects = selectedTenant
    ? projectsList.filter(
        (p) =>
          p.tenant === tenantsList.find((t) => t.id === selectedTenant)?.name,
      )
    : projectsList;

  const needsTenantSelect = audience === 'specific-tenant';
  const needsProjectSelect = audience === 'specific-project';
  const hasAudienceTarget = (!needsTenantSelect || Boolean(selectedTenant)) &&
    (!needsProjectSelect || Boolean(selectedProject));
  const isSystemWideAudience = audience === 'all';
  const isComposeValid = Boolean(title.trim()) &&
    Boolean(message.trim()) &&
    Boolean(audience) &&
    Boolean(priority) &&
    hasAudienceTarget;
  const areActionsDisabled = !isComposeValid || isSending || isScheduling ||
    !isSystemWideAudience;

  function handleAudienceChange(value: string) {
    setAudience(value);
    setSelectedTenant('');
    setSelectedProject('');
  }

  function handleEventChange(value: string) {
    setSelectedEvent(value);
    const selectedTemplate = eventTemplates.find((template) => template.id === value);
    if (!selectedTemplate) return;

    setMessage(selectedTemplate.message);
    setTitle((currentTitle) =>
      currentTitle.trim() ? currentTitle : selectedTemplate.title,
    );
  }

  function handleMessageClick() {
    if (!selectedEvent) return;
    const selectedTemplate = eventTemplates.find(
      (template) => template.id === selectedEvent,
    );
    if (!selectedTemplate) return;

    setMessage(selectedTemplate.message);
    setTitle((currentTitle) =>
      currentTitle.trim() ? currentTitle : selectedTemplate.title,
    );
  }

  function formatAudienceLabel(value: string) {
    if (value === 'all') return 'All Users';
    if (value === 'active-tenants') return 'All Active Tenants';
    if (value === 'admins') return 'Admins Only';
    if (value === 'specific-tenant') return 'Specific Tenant';
    if (value === 'specific-project') return 'Specific Project';
    return 'All Users';
  }

  function formatDisplayDate(date: Date) {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function resetComposeForm() {
    setSelectedEvent('');
    setTitle('');
    setMessage('');
    setAudience('all');
    setPriority('normal');
    setSelectedTenant('');
    setSelectedProject('');
  }

  function buildSystemRequest(): DispatchNotificationRequest {
    return {
      scope: NotificationScope.System,
      sourceType: NotificationSourceType.Manual,
      type: NotificationType.SystemAlert,
      title: title.trim(),
      body: message.trim(),
      severity: mapPriorityToSeverity(priority),
      channels: {
        inApp: true,
        email: false,
      },
      skipActor: false,
    };
  }

  function toErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'Failed to send notification';
  }

  function pushRecentNotification(notification: RecentNotification) {
    setSentNotifications((current) => [notification, ...current].slice(0, 12));
  }

  async function handleConfirmSendNow() {
    setIsSendConfirmOpen(false);
    setSendError(null);
    setSendSuccess(null);

    if (audience !== 'all') {
      setSendError('Send Now currently supports "All Users" target audience only.');
      return;
    }

    setIsSending(true);
    try {
      const payload = await dispatch(
        sendNotification({
          refreshUserId: currentUserId,
          request: buildSystemRequest(),
        }),
      ).unwrap();

      pushRecentNotification({
        id: Date.now(),
        title: title.trim(),
        audience: formatAudienceLabel(audience),
        date: formatDisplayDate(new Date()),
        status: 'sent',
      });
      setSendSuccess(
        `System notification sent to ${payload.recipients ?? 0} recipient(s).`,
      );
      resetComposeForm();
    } catch (error) {
      setSendError(toErrorMessage(error));
    } finally {
      setIsSending(false);
    }
  }

  function handleSendNowClick() {
    setSendError(null);
    setSendSuccess(null);

    if (audience !== 'all') {
      setSendError('Send Now currently supports "All Users" target audience only.');
      return;
    }

    setIsSendConfirmOpen(true);
  }

  function handleScheduleNotification() {
    setSendError(null);
    setSendSuccess(null);

    if (audience !== 'all') {
      setSendError(
        'Schedule currently supports "All Users" target audience only.',
      );
      return;
    }

    setIsScheduling(true);
    try {
      pushRecentNotification({
        id: Date.now(),
        title: title.trim(),
        audience: formatAudienceLabel(audience),
        date: formatDisplayDate(new Date()),
        status: 'scheduled',
        request: buildSystemRequest(),
      });
      setSendSuccess(
        'Notification scheduled. You can Send now or Cancel from Recent Notifications.',
      );
      resetComposeForm();
    } finally {
      setIsScheduling(false);
    }
  }

  async function handleScheduledSendNow(notificationId: number) {
    const scheduledNotification = sentNotifications.find(
      (item) => item.id === notificationId && item.status === 'scheduled',
    );

    if (!scheduledNotification?.request) {
      return;
    }

    setSendError(null);
    setSendSuccess(null);
    setPendingActionId(notificationId);
    try {
      const payload = await dispatch(
        sendNotification({
          refreshUserId: currentUserId,
          request: scheduledNotification.request,
        }),
      ).unwrap();

      setSentNotifications((current) =>
        current.map((item) =>
          item.id === notificationId
            ? {
                ...item,
                status: 'sent',
                request: undefined,
                date: formatDisplayDate(new Date()),
              }
            : item
        ),
      );
      setSendSuccess(
        `Scheduled notification sent to ${payload.recipients ?? 0} recipient(s).`,
      );
    } catch (error) {
      setSendError(toErrorMessage(error));
    } finally {
      setPendingActionId(null);
    }
  }

  function handleCancelScheduled(notificationId: number) {
    setSentNotifications((current) =>
      current.filter((item) => item.id !== notificationId),
    );
    setSendSuccess('Scheduled notification canceled.');
    setSendError(null);
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
              Event
            </label>
            <Select value={selectedEvent} onValueChange={handleEventChange}>
              <SelectTrigger className='w-full bg-background'>
                <SelectValue placeholder='Select event template' />
              </SelectTrigger>
              <SelectContent>
                {eventTemplates.map((eventTemplate) => (
                  <SelectItem key={eventTemplate.id} value={eventTemplate.id}>
                    {eventTemplate.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
              onClick={handleMessageClick}
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
            <Button
              variant='outline'
              size='sm'
              onClick={handleScheduleNotification}
              disabled={areActionsDisabled}
            >
              <Clock className='mr-1.5 size-3.5' />
              {isScheduling ? 'Scheduling...' : 'Schedule'}
            </Button>
            <Button
              size='sm'
              className='bg-primary text-primary-foreground hover:bg-primary/90'
              onClick={handleSendNowClick}
              disabled={areActionsDisabled}
            >
              <Send className='mr-1.5 size-3.5' />
              {isSending ? 'Sending...' : 'Send Now'}
            </Button>
          </div>
          {sendError && (
            <p className='text-xs font-medium text-destructive'>{sendError}</p>
          )}
          {sendSuccess && (
            <p className='text-xs font-medium text-emerald-700'>{sendSuccess}</p>
          )}
          {!isSystemWideAudience && (
            <p className='text-xs text-muted-foreground'>
              Switch target audience to All Users to send or schedule a
              system-wide notification.
            </p>
          )}
        </div>
      </div>

      {/* Recent Notifications */}
      <div className='w-full rounded-lg border border-border bg-card p-6 lg:w-96'>
        <h3 className='mb-4 text-sm font-semibold text-foreground'>
          Recent Notifications
        </h3>
        <div className='flex flex-col gap-3'>
          {sentNotifications.map((n) => (
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
                  className={`shrink-0 ${
                    n.status === 'scheduled'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {n.status === 'scheduled' ? (
                    <Clock className='mr-1 size-3' />
                  ) : (
                    <CheckCircle2 className='mr-1 size-3' />
                  )}
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
              {n.status === 'scheduled' && (
                <div className='mt-2 flex items-center gap-2'>
                  <Button
                    size='sm'
                    variant='secondary'
                    onClick={() => handleScheduledSendNow(n.id)}
                    disabled={pendingActionId === n.id}
                  >
                    {pendingActionId === n.id ? 'Sending...' : 'Send now'}
                  </Button>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => handleCancelScheduled(n.id)}
                    disabled={pendingActionId === n.id}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Dialog open={isSendConfirmOpen} onOpenChange={setIsSendConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Notification Now?</DialogTitle>
            <DialogDescription>
              This will send a system-wide notification to all users.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsSendConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmSendNow} disabled={isSending}>
              {isSending ? 'Sending...' : 'Confirm Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
