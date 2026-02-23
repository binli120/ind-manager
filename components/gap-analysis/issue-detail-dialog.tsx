// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AlertCircle, AlertTriangle, Info } from "lucide-react"
import { memo, useMemo } from "react"

interface Module {
  id: number
  name: string
  progress: number
  issues: number
  sections: number
}

interface IssueDetailDialogProps {
  open: boolean
  onClose: () => void
  module: Module | null | undefined
}

// Mock detailed issues data
const generateIssues = (moduleId: number, count: number) => {
  const severities = ["critical", "warning", "info"]
  const types = [
    "Missing required documentation",
    "Inconsistent data across sections",
    "Incomplete protocol information",
    "Missing regulatory signatures",
    "Outdated reference documents",
    "Formatting requirements not met",
  ]
  const assignees = [
    { name: "Dr. Sarah Smith", initials: "SS" },
    { name: "Dr. Michael Johnson", initials: "MJ" },
    { name: "Dr. Emily Williams", initials: "EW" },
    { name: "Dr. James Brown", initials: "JB" },
  ]

  return Array.from({ length: count }, (_, i) => {
    const severity = severities[Math.floor(Math.random() * severities.length)]
    const assignee = assignees[Math.floor(Math.random() * assignees.length)]

    return {
      id: `${moduleId}-issue-${i + 1}`,
      section: `Section ${moduleId}.${Math.floor(Math.random() * 10) + 1}`,
      severity,
      type: types[Math.floor(Math.random() * types.length)],
      description: `Detailed description of the issue found in section ${moduleId}.${i + 1}. This requires immediate attention to ensure compliance with FDA requirements.`,
      assignee,
      dueDate: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    }
  })
}

function IssueDetailDialogComponent({ open, onClose, module }: IssueDetailDialogProps) {
  const issues = useMemo(
    () => {
      if (!module || !open) return []
      return generateIssues(module.id, module.issues)
    },
    [module, open],
  )

  if (!module) return null



  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="w-4 h-4 text-error" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-warning" />
      default:
        return <Info className="w-4 h-4 text-info" />
    }
  }

  const getSeverityBadge = (severity: string) => {
    const variant = severity === "critical" ? "destructive" : severity === "warning" ? "default" : "secondary"
    return <Badge variant={variant}>{severity.toUpperCase()}</Badge>
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{module.name}</DialogTitle>
          <DialogDescription>
            {module.progress}% complete • {module.issues} {module.issues === 1 ? "issue" : "issues"} requiring attention
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {issues.map((issue) => (
              <div key={issue.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getSeverityIcon(issue.severity)}
                    <span className="font-semibold">{issue.section}</span>
                  </div>
                  {getSeverityBadge(issue.severity)}
                </div>

                <div>
                  <p className="font-medium text-sm">{issue.type}</p>
                  <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">{issue.assignee.initials}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{issue.assignee.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Due: {issue.dueDate}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export const IssueDetailDialog = memo(IssueDetailDialogComponent)
IssueDetailDialog.displayName = "IssueDetailDialog"
