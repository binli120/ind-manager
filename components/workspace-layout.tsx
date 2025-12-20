'use client';

import { CalendarView } from '@/components/calendar-view';
import { DesignSystemView } from '@/components/design-system-view';
import { DocumentView } from '@/components/document-view';
import { GapAnalysisView } from '@/components/gap-analysis-view';
import { GapScoringView } from '@/components/gap-scoring-view';
import { Header } from '@/components/header';
import { IndSubmissionView } from '@/components/ind-submission-view';
import { PostSubmissionView } from '@/components/post-submission-view';
import { ProjectsView } from '@/components/projects-view';
import { ReviewCenterView } from '@/components/review-center-view';
import { Sidebar } from '@/components/sidebar';
import { SmartEditorView } from '@/components/smart-editor-view';
import { SubmissionView } from '@/components/submission-view';
import { TeamsView } from '@/components/teams-view';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import {
  setCommentsPanelOpen,
  setCurrentView,
  setSidebarOpen,
} from '@/lib/store/slices/uiSlice';
import TenantsPage from './ui/tenants/tenants-page';
import UsersPage, { UserPrivilege } from './ui/users/users-page';
import { useEffect, useState } from 'react'; 
import { authServices } from "@/app/api/auth/auth-services";

export function WorkspaceLayout() {
  const dispatch = useAppDispatch();
  const { sidebarOpen, commentsPanelOpen, currentView } = useAppSelector(
    (state) => state.ui
  );

  //Use user privileges to determine what the user can see
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

  const handleViewChange = (view: typeof currentView) => {
    dispatch(setCurrentView(view));
  };

  return (
    <div className='flex h-screen bg-background'>
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={handleToggleSidebar}
        currentView={currentView}
        onViewChange={handleViewChange}
        currentUserPrivilege={currentUserPrivilege}
      />

      <div className='flex-1 flex flex-col min-w-0'>
        <Header
          onToggleSidebar={handleToggleSidebar}
          onToggleComments={handleToggleComments}
          currentView={currentView}
        />

        <div className='flex-1 flex min-h-0'>
          {currentView === 'projects' ? (
            <ProjectsView />
          ) : currentView === 'teams' ? (
            <TeamsView />
          ) : currentView === 'calendar' ? (
            <CalendarView />
          ) : currentView === 'submission' ? (
            <SubmissionView />
          ) : currentView === 'post-submission' ? (
            <PostSubmissionView />
          ) : currentView === 'gap-scoring' ? (
            <GapScoringView />
          ) : currentView === 'review-center' ? (
            <ReviewCenterView onViewChange={handleViewChange} />
          ) : currentView === 'gap-analysis' ? (
            <GapAnalysisView onViewChange={handleViewChange} />
          ) : currentView === 'ind-submission' ? (
            <IndSubmissionView />
          ) : currentView === 'tenants' ? (
            <TenantsPage />
          ) : currentView === 'users' ? (
            <UsersPage />
          ) : currentView === 'design-system' ? (
            <DesignSystemView />
          ) : currentView === 'document-authoring' ? (
            <SmartEditorView />
          ) : (
            <DocumentView onViewChange={handleViewChange} />
          )}
        </div>
      </div>
    </div>
  );
}
