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
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { Bell, ChevronDown, Menu, MessageSquare, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useProject } from '@/hooks/useProject';
import { useTeam } from '@/hooks/useTeam';
import { useAppDispatch } from '@/lib/store';
import { fetchUserDocuments } from '@/lib/store/slices/documentsSlice';
import {
  fetchProjectDetails,
  fetchProjects,
} from '@/lib/store/slices/projectsSlice';
import { fetchUserTeams } from '@/lib/store/slices/teamsSlice';

//correct identity deployment vercel

interface HeaderProps {
  onToggleSidebar: () => void;
  onToggleComments: () => void;
  currentView:
    | 'workspace'
    | 'projects'
    | 'teams'
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
  currentView,
}: HeaderProps) {
  const dispatch = useAppDispatch();
  const { projects, currentProject, selectedProjectId, setProject } =
    useProject();
  const { teams, currentTeam, selectedTeamId, setTeam } = useTeam();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

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

  // Fetch user teams when user loads
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchUserTeams(user.id));
    }
  }, [dispatch, user?.id]);

  // 2) If teams are loaded and we have no selection (not hydrated or invalid), pick the first
  useEffect(() => {
    if (!teams.length) return;
    if (!selectedTeamId) {
      setTeam(teams[0].id);
    } else if (!teams.some((t) => t.id === selectedTeamId)) {
      // saved id no longer valid in this list -> fallback to first
      setTeam(teams[0].id);
    }
  }, [teams, selectedTeamId, setTeam]);

  // 3) When team changes, fetch its projects
  useEffect(() => {
    if (selectedTeamId) {
      dispatch(fetchProjects(selectedTeamId));
    }
  }, [dispatch, selectedTeamId]);

  // 4) When projects arrive and no project selected (not hydrated or invalid), pick the first
  useEffect(() => {
    if (!projects.length) return;
    if (
      !selectedProjectId ||
      !projects.some((p) => p.id === selectedProjectId)
    ) {
      setProject(projects[0].id);
    }
  }, [projects, selectedProjectId, setProject]);

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
      case 'teams':
        return 'Teams';
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
            {/* TEAM SELECT DROPDOWN */}
            <Select
              value={selectedTeamId ?? ''}
              onValueChange={(teamId) => setTeam(teamId)}
            >
              <SelectTrigger className='w-48'>
                <SelectValue placeholder='Select team' />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
                {teams.length === 0 && (
                  <div className='px-3 py-2 text-xs text-muted-foreground'>
                    No teams available
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
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem
                    key={project.id}
                    value={project.id}
                    className='!text-gray-900 dark:!text-gray-100'
                  >
                    {project.title}
                  </SelectItem>
                ))}
                {projects.length === 0 && (
                  <div className='px-3 py-2 text-xs text-muted-foreground'>
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

          <Button variant='ghost' size='sm'>
            <Bell className='w-4 h-4' />
          </Button>

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
    </header>
  );
}
