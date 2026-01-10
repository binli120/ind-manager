"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, CheckCircle2, AlertCircle, AlertTriangle, FileQuestion, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

type SectionStatus = "complete" | "warning" | "missing" | "critical"

interface Section {
  id: string
  name: string
  status: SectionStatus
  assignee?: string
}

interface ModuleData {
  id: number
  name: string
  progress: number
  totalSections: number
  complete: number
  warning: number
  issues: number
  missing: number
  sectionsDetail: Section[]
}

interface ModuleStatusCardsProps {
  modules: ModuleData[]
  onSectionClick?: (moduleId: number, sectionId: string) => void
}

export function ModuleStatusCards({ modules, onSectionClick }: ModuleStatusCardsProps) {
  const [expandedModule, setExpandedModule] = useState<number | null>(null)

  const getProgressColor = (progress: number) => {
    if (progress === 100) return "bg-success"
    if (progress >= 85) return "bg-success"
    if (progress >= 60) return "bg-warning"
    return "bg-destructive"
  }

  const getProgressBadgeVariant = (progress: number): "default" | "secondary" | "destructive" => {
    if (progress === 100) return "default"
    if (progress >= 85) return "default"
    if (progress >= 60) return "secondary"
    return "destructive"
  }

  const getStatusColor = (status: SectionStatus) => {
    switch (status) {
      case "complete":
        return "bg-success"
      case "warning":
        return "bg-warning"
      case "critical":
        return "bg-destructive"
      case "missing":
        return "bg-muted"
    }
  }

  const getStatusIcon = (status: SectionStatus) => {
    switch (status) {
      case "complete":
        return <CheckCircle2 className="h-3 w-3" />
      case "warning":
        return <AlertTriangle className="h-3 w-3" />
      case "critical":
        return <AlertCircle className="h-3 w-3" />
      case "missing":
        return <FileQuestion className="h-3 w-3" />
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {modules.map((module) => {
        const isExpanded = expandedModule === module.id

        return (
          <Card key={module.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base font-semibold">{module.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{module.totalSections} sections</p>
                </div>
                <Badge
                  variant={getProgressBadgeVariant(module.progress)}
                  className={cn(
                    "text-sm font-semibold",
                    module.progress === 100 && "bg-success text-success-foreground animate-pulse",
                  )}
                >
                  {module.progress === 100 ? (
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      100%
                    </span>
                  ) : (
                    `${module.progress}%`
                  )}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full transition-all duration-500 rounded-full", getProgressColor(module.progress))}
                    style={{ width: `${module.progress}%` }}
                  />
                </div>
              </div>

              {/* Status Distribution */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-success" />
                  <span className="text-xs text-muted-foreground">{module.complete} Complete</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-warning" />
                  <span className="text-xs text-muted-foreground">{module.warning} Warning</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-destructive" />
                  <span className="text-xs text-muted-foreground">{module.issues} Issues</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-muted" />
                  <span className="text-xs text-muted-foreground">{module.missing} Missing</span>
                </div>
              </div>

              {/* Stacked Status Bar */}
              <div className="h-1.5 bg-muted rounded-full overflow-hidden flex">
                {module.complete > 0 && (
                  <div className="bg-success" style={{ width: `${(module.complete / module.totalSections) * 100}%` }} />
                )}
                {module.warning > 0 && (
                  <div className="bg-warning" style={{ width: `${(module.warning / module.totalSections) * 100}%` }} />
                )}
                {module.issues > 0 && (
                  <div
                    className="bg-destructive"
                    style={{ width: `${(module.issues / module.totalSections) * 100}%` }}
                  />
                )}
                {module.missing > 0 && (
                  <div
                    className="bg-muted-foreground/30"
                    style={{ width: `${(module.missing / module.totalSections) * 100}%` }}
                  />
                )}
              </div>

              {/* Expand/Collapse Button */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between"
                onClick={() => setExpandedModule(isExpanded ? null : module.id)}
              >
                <span className="text-xs">View Sections</span>
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>

              {/* Expanded Section List */}
              {isExpanded && (
                <div className="space-y-1 pt-2 border-t max-h-48 overflow-y-auto">
                  {module.sectionsDetail.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => onSectionClick?.(module.id, section.id)}
                      className="w-full flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          className={cn("flex-shrink-0", getStatusColor(section.status), "rounded p-0.5 text-white")}
                        >
                          {getStatusIcon(section.status)}
                        </div>
                        <span className="text-xs font-medium truncate">{section.name}</span>
                      </div>
                      {section.assignee && (
                        <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">{section.assignee}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
