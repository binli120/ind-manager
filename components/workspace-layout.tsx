// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
'use client';

import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import {
  logoutUser,
  setCommentsPanelOpen,
  setSidebarOpen,
} from '@/lib/store/slices';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

function WorkspaceLayoutComponent({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const { sidebarOpen, commentsPanelOpen, currentView } = useAppSelector(
    (state) => state.ui,
  );
  const {
    projects,
    isLoading: isProjectsLoading,
    hasLoadedOnce,
    error: projectsError,
  } = useAppSelector((state) => state.projects);
  const {
    user,
    isAuthenticated,
    isLoading: isAuthLoading,
  } = useAppSelector((state) => state.auth);
  const [showNoProjectDialog, setShowNoProjectDialog] = useState(false);

  const shouldLockWorkspace =
    isAuthenticated &&
    !isProjectsLoading &&
    hasLoadedOnce &&
    !projectsError &&
    projects.length === 0;

  const greetingName = useMemo(() => {
    if (user?.name) return user.name.split(' ')[0];
    if (user?.email) return user.email.split('@')[0];
    return 'there';
  }, [user]);

  useEffect(() => {
    setShowNoProjectDialog(shouldLockWorkspace);
  }, [shouldLockWorkspace]);

  const handleToggleSidebar = useCallback(() => {
    dispatch(setSidebarOpen(!sidebarOpen));
  }, [dispatch, sidebarOpen]);

  const handleToggleComments = useCallback(() => {
    dispatch(setCommentsPanelOpen(!commentsPanelOpen));
  }, [commentsPanelOpen, dispatch]);

  const handleLogout = useCallback(() => {
    dispatch(logoutUser());
  }, [dispatch]);

  const handleNotify = useCallback(() => {
    // Placeholder hook for future notification implementation
    console.info('Notify project manager placeholder');
    dispatch(logoutUser());
  }, [dispatch]);

  const isAuthPage = pathname?.startsWith('/auth/') || pathname === '/login';
  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      <div
        className={cn(
          'flex h-screen bg-background relative',
          shouldLockWorkspace && 'pointer-events-none opacity-50 blur-[2px]',
        )}
      >
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={handleToggleSidebar}
          view={currentView}
          currentUserPrivilege={user?.privilege || 'user'}
        />

        <div className='flex-1 flex flex-col min-w-0'>
          <Header
            onToggleSidebar={handleToggleSidebar}
            onToggleComments={handleToggleComments}
            currentView={currentView}
          />

          <div className='flex-1 flex min-h-0'>{children}</div>
        </div>
      </div>

      {isAuthenticated &&
        ((!hasLoadedOnce && !projectsError) ||
          isProjectsLoading ||
          isAuthLoading) && (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm'>
            <div className='flex flex-col items-center gap-3'>
              <div className='h-10 w-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin' />
              <p className='text-sm text-muted-foreground'>
                Loading workspace…
              </p>
            </div>
          </div>
        )}

      <Dialog
        open={showNoProjectDialog}
        onOpenChange={setShowNoProjectDialog}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>No project assigned</DialogTitle>
            <DialogDescription>
              Hi {greetingName}. You don&apos;t have any project assigned,
              please notify the project manager.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='flex justify-end gap-2 sm:justify-end'>
            <Button variant='outline' onClick={handleLogout}>
              Cancel
            </Button>
            <Button
              className='bg-emerald-600 hover:bg-emerald-700 text-white'
              onClick={handleNotify}
            >
              Notify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export const WorkspaceLayout = memo(WorkspaceLayoutComponent);
WorkspaceLayout.displayName = 'WorkspaceLayout';
