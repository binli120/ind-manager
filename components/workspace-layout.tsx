"use client"

import { useState } from "react"
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
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [commentsPanelOpen, setCommentsPanelOpen] = useState(true)
  const [currentView, setCurrentView] = useState<
    | "workspace"
    | "projects"
    | "teams"
    | "calendar"
    | "submission"
    | "post-submission"
    | "gap-scoring"
    | "review-center"
    | "gap-analysis"
    | "ind-submission"
    | "design-system"
  >("workspace")

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        currentView={currentView}
        onViewChange={setCurrentView}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onToggleComments={() => setCommentsPanelOpen(!commentsPanelOpen)}
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
            <ReviewCenterView onViewChange={setCurrentView} />
          ) : currentView === "gap-analysis" ? (
            <GapAnalysisView onViewChange={setCurrentView} />
          ) : currentView === "ind-submission" ? (
            <IndSubmissionView />
          ) : currentView === "design-system" ? (
            <DesignSystemView />
          ) : (
            <DocumentView onViewChange={setCurrentView} />
          )}
        </div>
      </div>
    </div>
  )
}
