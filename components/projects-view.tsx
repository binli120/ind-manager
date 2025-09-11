"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Plus, Grid3X3, List, Eye, Edit3, Play, Trash2, Users, Building2, Pill, Target } from "lucide-react"

interface Project {
  id: string
  title: string
  code: string
  description: string
  status: "draft" | "active" | "completed" | "paused"
  priority: "low" | "medium" | "high" | "critical"
  progress: number
  sponsor: string
  drug: string
  targetDate: string
  teamSize: number
  teamMembers: Array<{ name: string; avatar?: string; initials: string }>
}

const mockProjects: Project[] = [
  {
    id: "1",
    title: "Harliku Phase II",
    code: "dddd",
    description: "This is a test project.",
    status: "draft",
    priority: "medium",
    progress: 0,
    sponsor: "Cycle Pharmaceuticals",
    drug: "Harliku",
    targetDate: "8/31/2025",
    teamSize: 5,
    teamMembers: [
      { name: "John Doe", initials: "JD" },
      { name: "Jane Smith", initials: "JS" },
      { name: "Mike Johnson", initials: "MJ" },
    ],
  },
  {
    id: "2",
    title: "Yeztugo Study",
    code: "34556",
    description: "No description available",
    status: "draft",
    priority: "medium",
    progress: 0,
    sponsor: "Gilead Sciences, Inc.",
    drug: "Yeztugo",
    targetDate: "8/28/2025",
    teamSize: 5,
    teamMembers: [
      { name: "Sarah Wilson", initials: "SW" },
      { name: "David Brown", initials: "DB" },
      { name: "Lisa Chen", initials: "LC" },
    ],
  },
  {
    id: "3",
    title: "ABC Test In Oncology",
    code: "",
    description: "No description available",
    status: "draft",
    priority: "medium",
    progress: 0,
    sponsor: "ABC Pharma",
    drug: "ABC-123",
    targetDate: "12/31/2026",
    teamSize: 5,
    teamMembers: [
      { name: "Robert Taylor", initials: "RT" },
      { name: "Emily Davis", initials: "ED" },
      { name: "Alex Kim", initials: "AK" },
    ],
  },
]

const statusConfig = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-700 border-gray-200" },
  active: { label: "Active", color: "bg-blue-100 text-blue-700 border-blue-200" },
  completed: { label: "Completed", color: "bg-green-100 text-green-700 border-green-200" },
  paused: { label: "Paused", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
}

const priorityConfig = {
  low: { label: "Low", color: "bg-gray-100 text-gray-600" },
  medium: { label: "Medium", color: "bg-amber-100 text-amber-700" },
  high: { label: "High", color: "bg-orange-100 text-orange-700" },
  critical: { label: "Critical", color: "bg-red-100 text-red-700" },
}

export function ProjectsView() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")

  const filteredProjects = mockProjects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.sponsor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.drug.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || project.status === statusFilter
    const matchesPriority = priorityFilter === "all" || project.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50/50">
      {/* Header */}
      <div className="bg-background border-b border-border px-8 py-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Project Management</h1>
            <p className="text-muted-foreground text-lg">Manage your IND projects and track their progress</p>
          </div>

          <Button className="bg-purple-600 text-white hover:bg-purple-700 shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            Create Project
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-border shadow-sm"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-background border-border shadow-sm">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40 bg-background border-border shadow-sm">
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="shadow-sm"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="shadow-sm"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="p-8">
        <div
          className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`}
        >
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="group hover:shadow-lg transition-all duration-200 border-border bg-card flex flex-col h-full"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-card-foreground group-hover:text-primary transition-colors">
                        {project.title}
                      </h3>
                      <Badge className={statusConfig[project.status].color}>{statusConfig[project.status].label}</Badge>
                      <Badge className={priorityConfig[project.priority].color}>
                        {priorityConfig[project.priority].label}
                      </Badge>
                    </div>
                    {project.code && <p className="text-sm text-muted-foreground font-mono">{project.code}</p>}
                  </div>
                </div>

                <p className="text-muted-foreground text-sm leading-relaxed">{project.description}</p>
              </CardHeader>

              <CardContent className="space-y-4 flex-1 flex flex-col">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>

                {/* Project Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted" />
                      <div>
                        <p className="text-muted-foreground text-xs">Sponsor:</p>
                        <p className="font-medium text-card-foreground">{project.sponsor}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Pill className="w-4 h-4 text-muted" />
                      <div>
                        <p className="text-muted-foreground text-xs">Drug:</p>
                        <p className="font-medium text-card-foreground">{project.drug}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-muted" />
                      <div>
                        <p className="text-muted-foreground text-xs">Target Date:</p>
                        <p className="font-medium text-card-foreground">{project.targetDate}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted" />
                      <div>
                        <p className="text-muted-foreground text-xs">Team:</p>
                        <p className="font-medium text-card-foreground">{project.teamSize} members</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Team Avatars */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex -space-x-2">
                    {project.teamMembers.slice(0, 3).map((member, index) => (
                      <Avatar key={index} className="w-8 h-8 border-2 border-background">
                        <AvatarImage src={member.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs bg-accent/10 text-accent">{member.initials}</AvatarFallback>
                      </Avatar>
                    ))}
                    {project.teamMembers.length > 3 && (
                      <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">+{project.teamMembers.length - 3}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-4 border-t border-border mt-auto">
                  <Button variant="ghost" size="sm" className="flex-1 hover:bg-accent/10 hover:text-accent">
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1 hover:bg-accent/10 hover:text-accent">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <button
                    style={{
                      backgroundColor: "#8b5cf6",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "6px",
                      padding: "8px 12px",
                      fontSize: "14px",
                      fontWeight: "500",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                      flex: "1",
                      minHeight: "32px",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#7c3aed"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#8b5cf6"
                    }}
                    onClick={() => console.log("Resume clicked")}
                  >
                    <Play className="w-4 h-4" style={{ color: "#ffffff" }} />
                    <span style={{ color: "#ffffff" }}>Resume</span>
                  </button>
                  <Button variant="ghost" size="sm" className="hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No projects found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  )
}
