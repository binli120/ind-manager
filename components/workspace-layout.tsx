'use client';

import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import {
  setCommentsPanelOpen,
  setSidebarOpen,
} from '@/lib/store/slices/uiSlice';

export function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { sidebarOpen, commentsPanelOpen } = useAppSelector(
    (state) => state.ui
  );

  const handleToggleSidebar = () => {
    dispatch(setSidebarOpen(!sidebarOpen));
  };

  const handleToggleComments = () => {
    dispatch(setCommentsPanelOpen(!commentsPanelOpen));
  };

  return (
    <div className='flex h-screen bg-background'>
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={handleToggleSidebar}
      />

      <div className='flex-1 flex flex-col min-w-0'>
        <Header
          onToggleSidebar={handleToggleSidebar}
          onToggleComments={handleToggleComments}
        />

        <div className='flex-1 flex min-h-0'>
          {children}
        </div>
      </div>
    </div>
  );
}
