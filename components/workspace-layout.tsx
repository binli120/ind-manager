// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
'use client';

import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { ThemedLoadingScreen } from '@/components/ui/themed-loading-screen';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { setCommentsPanelOpen, setSidebarOpen } from '@/lib/store/slices/uiSlice';
import { authServices } from '@/lib/auth/auth-services';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { isAdminEmail } from '@/lib/utils';

export function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const { sidebarOpen, commentsPanelOpen, currentView } = useAppSelector(
    (state) => state.ui
  );
  const { projects, isLoading: isProjectsLoading, hasLoadedOnce, error: projectsError } = useAppSelector(
    (state) => state.projects
  );
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAppSelector((state) => state.auth);
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

  const [currentUserPrivilege, setCurrentUserPrivilege] = useState<string>('user');

  useEffect(() => {
    const privilege = typeof user?.privilege === 'string' ? user.privilege : null;
    const role = typeof user?.role === 'string' ? user.role : null;
    const email = typeof user?.email === 'string' ? user.email : null;
    const adminValues = new Set([
      'system_admin',
      'user_manager',
      'admin',
      'system_administrator',
    ]);

    if (email && isAdminEmail(email)) {
      setCurrentUserPrivilege('system_admin');
      return;
    }

    if (role && adminValues.has(role)) {
      setCurrentUserPrivilege(role);
      return;
    }

    if (privilege && adminValues.has(privilege)) {
      setCurrentUserPrivilege(privilege);
      return;
    }

    if (privilege) {
      setCurrentUserPrivilege(privilege);
      return;
    }
    if (role) {
      setCurrentUserPrivilege(role);
      return;
    }
    setCurrentUserPrivilege('user');
  }, [user?.privilege, user?.role, user?.email]);

  const handleToggleSidebar = useCallback(() => {
    dispatch(setSidebarOpen(!sidebarOpen));
  }, [dispatch, sidebarOpen]);

  const handleToggleComments = useCallback(() => {
    dispatch(setCommentsPanelOpen(!commentsPanelOpen));
  }, [commentsPanelOpen, dispatch]);

  const handleLogout = useCallback(async () => {
    await authServices.signOut();
    window.location.href = '/login';
  }, []);

  const handleNotify = useCallback(() => {
    const subject = encodeURIComponent('Project assignment request');
    const body = encodeURIComponent(
      `Hi team,\n\nI do not have any project assigned in the IND workspace.\nPlease assign one to my account (${user?.email ?? 'user email unknown'}).\n\nThanks!`
    );
    window.location.href = `mailto:pm@filynai.com?subject=${subject}&body=${body}`;
  }, [user?.email]);

  const isAuthPage = pathname?.startsWith('/auth/') || pathname === '/login' || pathname === '/register';

  if (isAuthPage) {
    return <main className='h-screen w-full bg-background'>{children}</main>;
  }

  return (
    <>
      <div className='flex h-screen bg-background'>
        <Sidebar
          isOpen={sidebarOpen}
          view={currentView}
          onToggle={handleToggleSidebar}
          currentUserPrivilege={currentUserPrivilege}
        />

        <div className='flex-1 flex flex-col min-w-0'>
          <Header
            onToggleSidebar={handleToggleSidebar}
            onToggleComments={handleToggleComments}
            currentView={currentView}
          />

          <div className='flex-1 flex min-h-0'>{children}</div>
        </div>

        {isAuthenticated &&
          ((!hasLoadedOnce && !projectsError) || isProjectsLoading || isAuthLoading) && (
            <div className="fixed inset-0 z-50">
              <ThemedLoadingScreen
                fullScreen={false}
                message="Loading workspace..."
                detail="Fetching IND projects, regulatory modules, and collaboration data."
              />
            </div>
          )}
      </div>

      <Dialog open={showNoProjectDialog} onOpenChange={setShowNoProjectDialog}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>No project assigned</DialogTitle>
            <DialogDescription>
              Hi {greetingName}. You don&apos;t have any project assigned, please notify the project manager.
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
