"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Menu, Search, Bell, MessageSquare, ChevronDown } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

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
            <Select defaultValue="harliku-phase-ii">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="harliku-phase-ii" className="!text-gray-900 dark:!text-gray-100">
                  Harliku Phase II
                </SelectItem>
                <SelectItem value="yeztugo-study" className="!text-gray-900 dark:!text-gray-100">
                  Yeztugo Study
                </SelectItem>
                <SelectItem value="abc-test-oncology" className="!text-gray-900 dark:!text-gray-100">
                  ABC Test In Oncology
                </SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="quality-summary">
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select document" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quality-summary" className="!text-gray-900 dark:!text-gray-100">
                  2.3 Quality Overall Summary
                </SelectItem>
                <SelectItem value="investigator-brochure" className="!text-gray-900 dark:!text-gray-100">
                  Investigator Brochure
                </SelectItem>
                <SelectItem value="clinical-protocol" className="!text-gray-900 dark:!text-gray-100">
                  Clinical Protocol
                </SelectItem>
                <SelectItem value="manufacturing-info" className="!text-gray-900 dark:!text-gray-100">
                  Manufacturing Information
                </SelectItem>
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

          <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-accent-foreground">E</span>
          </div>
        </div>
      </div>
    </header>
  )
}
