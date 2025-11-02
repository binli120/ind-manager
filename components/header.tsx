"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Menu, Search, Bell, MessageSquare, ChevronDown } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { LoginDialog } from "@/components/auth/login-dialog"
import { UserMenu } from "@/components/auth/user-menu"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
//
import { useAppSelector, useAppDispatch } from "@/lib/store"
import { fetchProjects, fetchProjectDetails, setSelectedProjectId } from "@/lib/store/slices/projectsSlice"
import { fetchUserTeams, setSelectedTeamId } from "@/lib/store/slices/teamsSlice"
import { fetchUserDocuments } from "@/lib/store/slices/documentsSlice"





interface HeaderProps {
  onToggleSidebar: () => void
  onToggleComments: () => void
  currentView:
    | "workspace"
    | "projects"
    | "teams"
    | "calendar"
    | "submission"
    | "post-submission"
    | "gap-scoring"
    | "review-center"
    | "gap-analysis"
}

export function Header({ onToggleSidebar, onToggleComments, currentView }: HeaderProps) {
  const dispatch = useAppDispatch()
  const { projects, currentProject } = useAppSelector((state) => state.projects)
  const { teams, currentTeam } = useAppSelector((state) => state.teams)

  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setIsLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fetch user teams
  useEffect(() => {
    //***placeholder for IM-9 user state***
    if (user?.id) {
      dispatch(fetchUserTeams(user.id))
    }
  }, [dispatch, user?.id])

  //Restore previous selection
  useEffect(() => {
    const savedTeamId = localStorage.getItem("selectedTeamId")
    if (savedTeamId) {
      // uses existing reducer
      dispatch(setSelectedTeamId(savedTeamId))
    }
    
  }, [dispatch])

  // auto select if team avaliable and none selected
  useEffect(() => {
    //***placeholder for IM-9 owned logic***
    if (!currentTeam?.id && teams.length > 0) {
      console.log("Auto-select first available team:", teams[0])
      dispatch(setSelectedTeamId(teams[0].id))
    }
  }, [teams, currentTeam, dispatch])

// Auto-fetch Projects when team changes
  useEffect(() => {
    if (currentTeam?.id) {
      dispatch(fetchProjects(currentTeam.id))
    }
  }, [dispatch, currentTeam?.id])

// Restore Saved Project if avaliable
  useEffect(() => {
    if (projects.length === 0) return
    //This is blocked by IM-9 logic
    const savedProjectId = localStorage.getItem("selectedProjectId")
    //
    if (
      savedProjectId &&
      projects.some((p) => p.id === savedProjectId)
    ) {
      dispatch(setSelectedProjectId(savedProjectId))
      dispatch(fetchProjectDetails(savedProjectId))
      if (user?.id) dispatch(fetchUserDocuments(user.id))
    }
  }, [projects, dispatch, user?.id])

  //Auto select first if none restored
  useEffect(() => {
    //***placeholder for IM-9 owned logic***
    if (!currentProject?.id && projects.length > 0) {
      const fallback = projects[0].id
      //console.log("Auto-select fallback project:", fallback)
      dispatch(setSelectedProjectId(fallback))
      dispatch(fetchProjectDetails(fallback))
      if (user?.id) dispatch(fetchUserDocuments(user.id))
    }
  }, [currentProject, projects, dispatch, user?.id])


  useEffect(() => {
    //console.log("currentTeam changed:", currentTeam);
    //***This is blocked by IM-9 logic***
    //
    if (currentTeam?.id) localStorage.setItem("selectedTeamId", currentTeam.id)
  }, [currentTeam?.id])

  useEffect(() => {
    //console.log("currentProject changed:", currentProject);
    //***This is blocked by IM-9 logic***
    if (currentProject?.id) localStorage.setItem("selectedProjectId", currentProject.id)
  }, [currentProject?.id])



  const getBreadcrumbText = () => {
    switch (currentView) {
      case "projects":
        return "Projects"
      case "teams":
        return "Teams"
      case "calendar":
        return "Calendar"
      case "submission":
        return "Submission"
      case "post-submission":
        return "Post Submission"
      case "gap-scoring":
        return "Test Gap Scoring"
      case "review-center":
        return "Review Center"
      case "gap-analysis":
        return "Gap Analysis"
      default:
        return "eCTD Workspace"
    }
  }

  return (
    <header className="bg-background border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onToggleSidebar}>
            <Menu className="w-4 h-4" />
          </Button>

          <nav className="flex items-center gap-2 text-sm text-muted">
            <span>Home</span>
            <ChevronDown className="w-3 h-3 rotate-[-90deg]" />
            <span className="text-foreground font-medium">{getBreadcrumbText()}</span>
          </nav>
        </div>

        {currentView === "workspace" && (
          <div className="flex items-center gap-3">
            {/* TEAM SELECT DROPDOWN */}
            <Select
              value={currentTeam?.id ?? ""}
              onValueChange={(teamId) => dispatch(setSelectedTeamId(teamId))}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
                {teams.length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    No teams available
                  </div>
                )}
              </SelectContent>
            </Select>
            {/*PROJECT SELECT DROPDOWN */}
            <Select
              value={currentProject?.id || ""}
              onValueChange={(projectId) => {
                dispatch(setSelectedProjectId(projectId))
                dispatch(fetchProjectDetails(projectId))
                if (user?.id) dispatch(fetchUserDocuments(user.id))
              }}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id} className="!text-gray-900 dark:!text-gray-100">
                    {project.title}
                  </SelectItem>
                ))}
                {projects.length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">No projects found</div>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm">
            <Search className="w-4 h-4" />
          </Button>

          <Button variant="ghost" size="sm">
            <Bell className="w-4 h-4" />
          </Button>

          <Button variant="ghost" size="sm" onClick={onToggleComments}>
            <MessageSquare className="w-4 h-4" />
          </Button>

          <ThemeToggle />

          {isLoading ? (
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            <UserMenu />
          ) : (
            <LoginDialog />
          )}
        </div>
      </div>
    </header>
  )
}
