"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  FileText,
  Users,
  Calendar,
  Upload,
  BarChart3,
  Home,
  Brain,
  CheckSquare,
  Palette,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
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
    | "ind-submission"
    | "design-system"
  onViewChange: (
    view:
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
      | "design-system",
  ) => void
}

export function Sidebar({ isOpen, onToggle, currentView, onViewChange }: SidebarProps) {
  const navigationItems = [
    {
      icon: Home,
      label: "Workspace",
      active: currentView === "workspace",
      badge: null,
      onClick: () => onViewChange("workspace"),
    },
    {
      icon: FileText,
      label: "Projects",
      active: currentView === "projects",
      badge: "3",
      onClick: () => onViewChange("projects"),
    },
    {
      icon: Users,
      label: "Teams",
      active: currentView === "teams",
      badge: null,
      onClick: () => onViewChange("teams"),
    },
    {
      icon: Calendar,
      label: "Calendar",
      active: currentView === "calendar",
      badge: null,
      onClick: () => onViewChange("calendar"),
    },
  ]

  const submissionItems = [
    {
      icon: Upload,
      label: "IND Submission",
      active: currentView === "submission",
      onClick: () => onViewChange("submission"),
    },
    {
      icon: CheckSquare,
      label: "Acknowledge",
      active: currentView === "ind-submission",
      onClick: () => onViewChange("ind-submission"),
    },
    {
      icon: FileText,
      label: "Post Submission",
      active: currentView === "post-submission",
      onClick: () => onViewChange("post-submission"),
    },
  ]

  const analysisItems = [
    {
      icon: BarChart3,
      label: "Gap Scoring",
      active: currentView === "gap-scoring",
      onClick: () => onViewChange("gap-scoring"),
    },
  ]

  const designItems = [
    {
      icon: Palette,
      label: "Design System",
      active: currentView === "design-system",
      onClick: () => onViewChange("design-system"),
    },
  ]

  return (
    <div
      className={cn(
        "bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
        isOpen ? "w-64" : "w-16",
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-700 rounded-lg flex items-center justify-center shadow-sm">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-white"></div>
          </div>
          {isOpen && (
            <div className="flex flex-col">
              <span className="font-bold text-lg text-sidebar-foreground leading-none">FilynAI</span>
              <span className="text-xs text-muted font-medium">Regulatory Intelligence</span>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>

      {/* Search */}
      {isOpen && (
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
            <Input placeholder="Search..." className="pl-10 bg-sidebar-primary border-sidebar-border" />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {/* Team Space */}
        <div className="p-4">
          {isOpen && <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Team Space</h3>}
          <nav className="space-y-1">
            {navigationItems.map((item) => (
              <Button
                key={item.label}
                variant={item.active ? "secondary" : "ghost"}
                onClick={item.onClick}
                className={cn(
                  "w-full justify-start gap-3 h-10",
                  !isOpen && "justify-center px-2",
                  item.active && "bg-sidebar-primary text-sidebar-primary-foreground",
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {isOpen && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Button>
            ))}
          </nav>
        </div>

        {/* Submission Management */}
        <div className="p-4">
          {isOpen && (
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Submission Management</h3>
          )}
          <nav className="space-y-1">
            {submissionItems.map((item) => (
              <Button
                key={item.label}
                variant={item.active ? "secondary" : "ghost"}
                onClick={item.onClick}
                className={cn(
                  "w-full justify-start gap-3 h-10",
                  !isOpen && "justify-center px-2",
                  item.active && "bg-sidebar-primary text-sidebar-primary-foreground",
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {isOpen && <span className="flex-1 text-left">{item.label}</span>}
              </Button>
            ))}
          </nav>
        </div>

        {/* AI Analysis */}
        <div className="p-4">
          {isOpen && <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">AI Analysis</h3>}
          <nav className="space-y-1">
            {analysisItems.map((item) => (
              <Button
                key={item.label}
                variant={item.active ? "secondary" : "ghost"}
                onClick={item.onClick}
                className={cn(
                  "w-full justify-start gap-3 h-10",
                  !isOpen && "justify-center px-2",
                  item.active && "bg-sidebar-primary text-sidebar-primary-foreground",
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {isOpen && <span className="flex-1 text-left">{item.label}</span>}
              </Button>
            ))}
          </nav>
        </div>

        <div className="p-4">
          {isOpen && <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Design</h3>}
          <nav className="space-y-1">
            {designItems.map((item) => (
              <Button
                key={item.label}
                variant={item.active ? "secondary" : "ghost"}
                onClick={item.onClick}
                className={cn(
                  "w-full justify-start gap-3 h-10",
                  !isOpen && "justify-center px-2",
                  item.active && "bg-sidebar-primary text-sidebar-primary-foreground",
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {isOpen && <span className="flex-1 text-left">{item.label}</span>}
              </Button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
}
