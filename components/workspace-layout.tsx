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
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { authServices } from '@/app/api/auth/auth-services';
import type { UserPrivilege } from '@/components/ui/users/users-page';

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

  const [currentUserPrivilege, setCurrentUserPrivilege] = useState<UserPrivilege | ''>('');

  useEffect(() => {
    async function getUserPrivilege() {
      const authData = await authServices.getUser();
      const authUser = authData.data?.user;
      if (authUser) {
        const privilege = (authUser?.user_metadata?.privilege as UserPrivilege) ?? 'user';
        setCurrentUserPrivilege(privilege);
      }
    }
    getUserPrivilege();
  }, []);

  const handleToggleSidebar = () => {
    dispatch(setSidebarOpen(!sidebarOpen));
  };

  const handleToggleComments = () => {
    dispatch(setCommentsPanelOpen(!commentsPanelOpen));
  };

  const handleLogout = async () => {
    await authServices.signOut();
    window.location.href = '/login';
  };

  const handleNotify = () => {
    const subject = encodeURIComponent('Project assignment request');
    const body = encodeURIComponent(
      `Hi team,\n\nI do not have any project assigned in the IND workspace.\nPlease assign one to my account (${user?.email ?? 'user email unknown'}).\n\nThanks!`
    );
    window.location.href = `mailto:pm@filynai.com?subject=${subject}&body=${body}`;
  };

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
