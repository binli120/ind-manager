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
import { useAppDispatch, useAppSelector } from '@/lib/store';
import {
  setCommentsPanelOpen,
  setCurrentView,
  setSidebarOpen,
} from '@/lib/store/slices/uiSlice';
import TenantsPage from './ui/tenants/tenants-page';
import UsersPage from './ui/users/users-page';

export function WorkspaceLayout() {
  const dispatch = useAppDispatch();
  const { sidebarOpen, commentsPanelOpen, currentView } = useAppSelector(
    (state) => state.ui
  );

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
