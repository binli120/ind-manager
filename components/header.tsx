// Author: Bin Lee
// Email: binlee120@gmail.com
'use client';

import { LoginDialog } from '@/components/auth/login-dialog';
import { UserMenu } from '@/components/auth/user-menu';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronDown, Menu, MessageSquare, Search } from 'lucide-react';
import { APP_BUILD_NUMBER, APP_NAME } from '@/lib/app-info';
import { useHeaderController } from '@/hooks/useHeaderController';
import type { HeaderView } from '@/lib/header/headerViewModel';

import { NotificationsBell } from "@/components/notifications/NotificationsBell";
import { NotificationsPanel } from "@/components/notifications/NotificationsPanel";


//correct identity deployment vercel

interface HeaderProps {
  onToggleSidebar: () => void;
  onToggleComments: () => void;
  currentView?: HeaderView;
}

export function Header({
  onToggleSidebar,
  onToggleComments,
  currentView = 'workspace',
}: HeaderProps) {
  const {
    user,
    isLoading,
    tenants,
    selectedTenantId,
    setTenant,
    effectiveProjects,
    selectedProjectId,
    setProject,
    breadcrumbText,
  } = useHeaderController(currentView);

  return (
    <header className='bg-background border-b border-border px-6 py-4'>
      <div className='flex items-center justify-between'>
        {/* Left side */}
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='sm' onClick={onToggleSidebar}>
            <Menu className='w-4 h-4' />
          </Button>

          <div className='hidden md:flex flex-col leading-tight'>
            <span className='text-sm font-semibold text-foreground'>{APP_NAME}</span>
            <span className='text-xs text-muted-foreground'>Build {APP_BUILD_NUMBER}</span>
          </div>

          <nav className='flex items-center gap-2 text-sm text-muted'>
            <span>Home</span>
            <ChevronDown className='w-3 h-3 rotate-[-90deg]' />
            <span className='text-foreground font-medium'>
              {breadcrumbText}
            </span>
          </nav>
        </div>

        {currentView === 'workspace' && (
          <div className='flex items-center gap-3'>
            {/* TENANT SELECT DROPDOWN */}
            <Select
              value={selectedTenantId ?? ""}
              onValueChange={(tenantId) => setTenant(tenantId)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select tenant" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
                {tenants.length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    No tenants available
                  </div>
                )}
              </SelectContent>
            </Select>

            {/* PROJECT SELECT DROPDOWN */}
            <Select
              value={selectedProjectId || effectiveProjects[0]?.id || ''}
              onValueChange={(projectId) => {
                setProject(projectId);
                // details + docs fetched by effect above
              }}
            >
              <SelectTrigger className='w-56'>
                <SelectValue placeholder='Select project' />
              </SelectTrigger>
              {/**IM-29 select projects owned by tenant */}
              <SelectContent className="max-h-42 overflow-y-auto">
                {effectiveProjects.map((project) => (
                  <SelectItem
                    key={project.id}
                    value={project.id}
                    className="!text-gray-900 dark:!text-gray-100"
                  >
                    <div className="flex flex-col text-left gap-0.5">
                      <span className="font-medium">{project.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {project.code} • {project.userRole ?? "guest"}
                      </span>
                    </div>
                  </SelectItem>
                ))}
                {effectiveProjects.length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    No projects found
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Right side */}
        <div className='flex items-center gap-3'>
          <Button variant='ghost' size='sm'>
            <Search className='w-4 h-4' />
          </Button>

          <NotificationsBell userId={user?.id} />

          <Button variant='ghost' size='sm' onClick={onToggleComments}>
            <MessageSquare className='w-4 h-4' />
          </Button>

          <ThemeToggle />

          {isLoading ? (
            <div className='w-8 h-8 rounded-full bg-muted animate-pulse' />
          ) : user ? (
            <UserMenu />
          ) : (
            <LoginDialog />
          )}
        </div>
      </div>
      <NotificationsPanel userId={user?.id} />
    </header>
  );
}
