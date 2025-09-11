"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/data-table"
import { CommentsPanel } from "@/components/comments-panel"
import {
  FileText,
  MessageSquare,
  Edit3,
  Calendar,
  User,
  Users,
  Clock,
  AlertTriangle,
  MoreHorizontal,
  Play,
} from "lucide-react"

interface DocumentViewProps {
  onViewChange?: (
    view:
      | "workspace"
      | "projects"
      | "teams"
      | "calendar"
      | "submission"
      | "post-submission"
      | "gap-analysis"
      | "review-center",
  ) => void
}

export function DocumentView({ onViewChange }: DocumentViewProps) {
  const documentMetadata = [
    { label: "Document Status", value: "Draft", icon: FileText, status: "draft" },
    { label: "Document Owner", value: "Joseph Kan", icon: User },
    { label: "My Roles", value: "None", icon: Users },
    { label: "Due Date", value: "2025-09-01", icon: Calendar },
    { label: "Last Modified", value: "38 days ago", icon: Clock },
    { label: "Active Users", value: "1 active", icon: Users },
  ]

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Document Header */}
      <div className="bg-background border-b border-border px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <Select defaultValue="filyn-dev-team">
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="filyn-dev-team">FilynAI Dev Team</SelectItem>
              <SelectItem value="clinical-team">Clinical Team</SelectItem>
              <SelectItem value="regulatory-team">Regulatory Team</SelectItem>
              <SelectItem value="qa-team">QA Team</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-foreground">Workspace</h1>
              <Badge variant="secondary">
                <Users className="w-3 h-3 mr-1" />
                FilynAI Dev Team
              </Badge>
            </div>
            <p className="text-muted">Document authoring and review center</p>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Document Authoring</h3>
                  <p className="text-sm text-muted">Create and edit documents</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onViewChange?.("review-center")}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold">Review Center</h3>
                  <p className="text-sm text-muted">Collaborate and review</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onViewChange?.("gap-analysis")}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-chart-1/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-chart-1" />
                </div>
                <div>
                  <h3 className="font-semibold">Gap Analysis</h3>
                  <p className="text-sm text-muted">Identify missing content</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Document Content */}
      <div className="px-8 py-6">
        {/* Document Title and Actions */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-foreground">2.3 - Quality Overall Summary</h2>
            <Button variant="ghost" size="sm" className="text-muted">
              View section details
            </Button>
          </div>

          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <MoreHorizontal className="w-4 h-4 mr-2" />
            Actions
          </Button>
        </div>

        {/* Document Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {documentMetadata.map((item) => (
            <div key={item.label} className="space-y-2 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-muted">
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                {item.status === "draft" ? (
                  <Badge variant="outline" className="text-muted border-muted">
                    {item.value}
                  </Badge>
                ) : (
                  <span className="text-sm font-medium">{item.value}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Generated Document Section */}
        <Card className="mb-8">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Generated Document</h3>
                <p className="text-sm text-muted">Create and edit document</p>
              </div>
              <Button variant="outline" size="sm">
                <Edit3 className="w-4 h-4 mr-2" />
                Start Editing
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              {/* Document Content Area */}
              <div className="flex-1">
                <div className="bg-card rounded-lg p-6 border border-border">
                  <div className="flex items-center gap-2 text-sm text-muted mb-4">
                    <Play className="w-4 h-4" />
                    <span>Click "Start Editing" to begin editing this section</span>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium italic mb-4">The Common Technical Document - Safety</h4>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">1. Pharmacokinetics Overview Test Article: (1)</h5>
                    </div>

                    {/* Data Table */}
                    <DataTable />
                  </div>
                </div>
              </div>

              {/* Comments Panel */}
              <div className="flex-shrink-0">
                <CommentsPanel />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
