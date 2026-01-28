// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
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
import { createBrowserClient } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { ChevronDown, Menu, MessageSquare, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useProject } from '@/hooks/useProject';
import { useAppDispatch } from '@/lib/store';
import { fetchUserDocuments } from '@/lib/store/slices/documentsSlice';
import {
  fetchProjects,
  fetchProjectDetails,
} from '@/lib/store/slices/projectsSlice';

import { useTenant } from "@/hooks/useTenant";
import { fetchUserTenants } from "@/lib/store/slices/tenantsSlice";

import { NotificationsBell } from "@/components/notifications/NotificationsBell";
import { NotificationsPanel } from "@/components/notifications/NotificationsPanel";


//correct identity deployment vercel

interface HeaderProps {
  onToggleSidebar: () => void;
  onToggleComments: () => void;
  currentView?: 'workspace'
    | 'projects'
    | 'calendar'
    | 'submission'
    | 'post-submission'
    | 'gap-scoring'
    | 'review-center'
    | 'tenants'
    | 'users'
    | 'gap-analysis';
}

export function Header({
  onToggleSidebar,
  onToggleComments,
  currentView = 'workspace',
}: HeaderProps) {
  const dispatch = useAppDispatch();
  const { projects, selectedProjectId, setProject } =
    useProject();
  //IM-29: Select tenants_id to fetch projects
  const { tenants, selectedTenantId, setTenant } = useTenant();
  const visibleProjects = selectedTenantId
  ? projects.filter((p) => p.tenantId === selectedTenantId)
  : projects;

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient();

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user tenants when user loads
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchUserTenants({ userId: user.id }));
    }
  }, [dispatch, user?.id]);


  // 2) 
  useEffect(() => {
    if (!tenants.length) return;
    if (!selectedTenantId) {
      setTenant(tenants[0].id);
    } else if (!tenants.some((t) => t.id === selectedTenantId)) {
      setTenant(tenants[0].id);
    }
  }, [tenants, selectedTenantId, setTenant]);


  // 3)fetch its projects
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchProjects({ userId: user.id }));
    }
  }, [dispatch, user?.id]);

  // When projects arrive and no project selected (not hydrated or invalid), pick the first
  useEffect(() => {
    if (!visibleProjects.length) return;
    if (
      !selectedProjectId ||
      !visibleProjects.some((p) => p.id === selectedProjectId)
    ) {
      setProject(visibleProjects[0].id);
    }
  }, [visibleProjects, selectedProjectId, setProject]);

  // 5) When project selection changes, hydrate detail + any dependent data
  useEffect(() => {
    if (selectedProjectId) {
      dispatch(fetchProjectDetails(selectedProjectId));
      if (user?.id) dispatch(fetchUserDocuments(user.id));
    }
  }, [dispatch, selectedProjectId, user?.id]);

  const getBreadcrumbText = () => {
    switch (currentView) {
      case 'projects':
        return 'Projects';
      case 'calendar':
        return 'Calendar';
      case 'submission':
        return 'Submission';
      case 'post-submission':
        return 'Post Submission';
      case 'gap-scoring':
        return 'Test Gap Scoring';
      case 'review-center':
        return 'Review Center';
      case 'gap-analysis':
        return 'Gap Analysis';
      case 'tenants':
        return 'Tenants';
      case 'users':
        return 'Users';
      default:
        return 'eCTD Workspace';
    }
  };

  return (
    <header className='bg-background border-b border-border px-6 py-4'>
      <div className='flex items-center justify-between'>
        {/* Left side */}
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='sm' onClick={onToggleSidebar}>
            <Menu className='w-4 h-4' />
          </Button>

          <nav className='flex items-center gap-2 text-sm text-muted'>
            <span>Home</span>
            <ChevronDown className='w-3 h-3 rotate-[-90deg]' />
            <span className='text-foreground font-medium'>
              {getBreadcrumbText()}
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
              value={selectedProjectId || ''}
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
                {visibleProjects.map((project) => (
                  <SelectItem
                    key={project.id}
                    value={project.id}
                    className="!text-gray-900 dark:!text-gray-100"
                  >
                    {project.title}
                  </SelectItem>
                ))}
                {visibleProjects.length === 0 && (
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
