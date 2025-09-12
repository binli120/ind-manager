"use client"

import { useAppSelector, useAppDispatch } from "@/lib/store"
import { setSidebarOpen, setCommentsPanelOpen, setCurrentView } from "@/lib/store/slices/uiSlice"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { DocumentView } from "@/components/document-view"
import { ProjectsView } from "@/components/projects-view"
import { TeamsView } from "@/components/teams-view"
import { CalendarView } from "@/components/calendar-view"
import { SubmissionView } from "@/components/submission-view"
import { PostSubmissionView } from "@/components/post-submission-view"
import { GapScoringView } from "@/components/gap-scoring-view"
import { ReviewCenterView } from "@/components/review-center-view"
import { GapAnalysisView } from "@/components/gap-analysis-view"
import { IndSubmissionView } from "@/components/ind-submission-view"
import { DesignSystemView } from "@/components/design-system-view"

export function WorkspaceLayout() {
  const dispatch = useAppDispatch()
  const { sidebarOpen, commentsPanelOpen, currentView } = useAppSelector((state) => state.ui)

  const handleToggleSidebar = () => {
    dispatch(setSidebarOpen(!sidebarOpen))
  }

  const handleToggleComments = () => {
    dispatch(setCommentsPanelOpen(!commentsPanelOpen))
  }

  const handleViewChange = (view: typeof currentView) => {
    dispatch(setCurrentView(view))
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={handleToggleSidebar}
        currentView={currentView}
        onViewChange={handleViewChange}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onToggleSidebar={handleToggleSidebar}
          onToggleComments={handleToggleComments}
          currentView={currentView}
        />

        <div className="flex-1 flex min-h-0">
          {currentView === "projects" ? (
            <ProjectsView />
          ) : currentView === "teams" ? (
            <TeamsView />
          ) : currentView === "calendar" ? (
            <CalendarView />
          ) : currentView === "submission" ? (
            <SubmissionView />
          ) : currentView === "post-submission" ? (
            <PostSubmissionView />
          ) : currentView === "gap-scoring" ? (
            <GapScoringView />
          ) : currentView === "review-center" ? (
            <ReviewCenterView onViewChange={handleViewChange} />
          ) : currentView === "gap-analysis" ? (
            <GapAnalysisView onViewChange={handleViewChange} />
          ) : currentView === "ind-submission" ? (
            <IndSubmissionView />
          ) : currentView === "design-system" ? (
            <DesignSystemView />
          ) : (
            <DocumentView onViewChange={handleViewChange} />
          )}
        </div>
      </div>
    </div>
  )
}
