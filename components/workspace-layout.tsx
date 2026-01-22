'use client';

import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import {
  setCommentsPanelOpen,
  setSidebarOpen,
} from '@/lib/store/slices/uiSlice';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authServices } from '@/app/api/auth/auth-services';
import type { UserPrivilege } from '@/components/ui/users/users-page';

export function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const { sidebarOpen, commentsPanelOpen, currentView } = useAppSelector(
    (state) => state.ui
  );

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

  const isAuthPage = pathname?.startsWith('/auth/') || pathname === '/login' || pathname === '/register';

  if (isAuthPage) {
    return <main className='h-screen w-full bg-background'>{children}</main>;
  }

  return (
    <div className='flex h-screen bg-background'>
      <Sidebar 
        isOpen={sidebarOpen} 
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
    </div>
  );
}
