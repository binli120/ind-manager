// Author: Bin Lee
// Email: binlee120@gmail.com
"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
//class merge for active
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Plus,
  Grid3X3,
  List,
  Eye,
  Edit3,
  Play,
  Trash2,
  Users,
  Building2,
  Pill,
  Target,
} from "lucide-react";
import { useProjectsViewController } from "@/hooks/useProjectsViewController";
import { ProjectForm } from "./ui/projects/project-form";
import { useCallback, type ChangeEvent, type MouseEvent } from "react";
import {
  PROJECT_PRIORITY_BADGE_CONFIG,
  PROJECT_PRIORITY_FILTER_OPTIONS,
  PROJECT_STATUS_BADGE_CONFIG,
  PROJECT_STATUS_FILTER_OPTIONS,
  isProjectStatusFilterHeader,
} from "@/lib/projects/constants";

export function ProjectsView() {
  const {
    user,
    viewMode,
    filters,
    isLoading,
    showCreateDialog,
    isCreatingProject,
    createProjectError,
    showEditDialog,
    editProject,
    page,
    totalPages,
    filteredProjects,
    pagedProjects,
    handleViewModeChange,
    handleSearchChange,
    handleStatusFilterChange,
    handlePriorityFilterChange,
    openCreateDialog,
    closeCreateDialog,
    handleCreateProject,
    closeEditDialog,
    handleEditProject,
    handleDeleteProject,
    openEditDialog,
    goToPreviousPage,
    goToNextPage,
  } = useProjectsViewController();

  const handleSearchInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    handleSearchChange(event.target.value);
  }, [handleSearchChange]);

  const handleGridViewModeChange = useCallback(() => {
    handleViewModeChange("grid");
  }, [handleViewModeChange]);

  const handleListViewModeChange = useCallback(() => {
    handleViewModeChange("list");
  }, [handleViewModeChange]);

  const handleEditProjectClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    const projectId = event.currentTarget.dataset.projectId;
    if (projectId) {
      openEditDialog(projectId);
    }
  }, [openEditDialog]);

  const handleDeleteProjectClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    const projectId = event.currentTarget.dataset.projectId;
    if (projectId) {
      handleDeleteProject(projectId);
    }
  }, [handleDeleteProject]);

  const handleResumeMouseEnter = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    if (event.currentTarget.dataset.enabled === "true") {
      event.currentTarget.style.backgroundColor = "#7c3aed";
    }
  }, []);

  const handleResumeMouseLeave = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    if (event.currentTarget.dataset.enabled === "true") {
      event.currentTarget.style.backgroundColor = "#8b5cf6";
    }
  }, []);

  const handleResumeClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    if (event.currentTarget.dataset.enabled === "true") {
      console.log("Resume clicked");
    }
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50/50">
      {/* Header */}
      <div className="bg-background border-b border-border px-8 py-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Project Management
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage your IND projects and track their progress
            </p>
          </div>

          <Button
            className="bg-purple-600 text-white hover:bg-purple-700 shadow-sm"
            onClick={openCreateDialog}
          >
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
                value={filters.search}
                onChange={handleSearchInputChange}
                className="pl-10 bg-background border-border shadow-sm"
              />
            </div>

            <Select
              value={filters.status}
              onValueChange={handleStatusFilterChange}
            > {/*IM-61 Update status dropdown */}
              <SelectTrigger className="w-40 bg-background border-border shadow-sm">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {PROJECT_STATUS_FILTER_OPTIONS.map((opt, idx) =>
                  isProjectStatusFilterHeader(opt) ? (
                    <div key={`hdr-${idx}`} className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-default select-none">
                      {opt.header}
                    </div>
                  ) : (
                    <SelectItem key={opt.value ?? `opt-${idx}`} value={opt.value ?? ""} className="whitespace-normal text-left">
                      {opt.label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>

            <Select
              value={filters.priority}
              onValueChange={handlePriorityFilterChange}
            >
              <SelectTrigger className="w-40 bg-background border-border shadow-sm">
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
               <SelectContent>
                {PROJECT_PRIORITY_FILTER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={handleGridViewModeChange}
              className="shadow-sm"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={handleListViewModeChange}
              className="shadow-sm"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="p-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        ) : (
          <div
            className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`}
          > {/**IM-61 card active card green gradient styling + resume disable */}
            {pagedProjects.map((project) => {
              const isResumeEnabled = project.status === "inactive";
              return (
                <Card
                  key={project.id}
                  className={cn(
                    "shadow-sm border transition",
                    project.status === "active" && "bg-gradient-to-br from-emerald-50 to-white border-emerald-100"
                  )}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-card-foreground group-hover:text-primary transition-colors">
                            {project.title}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                             <Badge
                                className={`${PROJECT_STATUS_BADGE_CONFIG[project.status].color} text-xs px-2 py-1 leading-tight whitespace-normal break-words max-w-[240px]`}
                              >
                                {PROJECT_STATUS_BADGE_CONFIG[project.status].label}
                              </Badge>
                              <Badge
                                className={`${PROJECT_PRIORITY_BADGE_CONFIG[project.priority].color} text-xs px-2 py-1 leading-tight whitespace-normal break-words max-w-[160px]`}
                              >
                                {PROJECT_PRIORITY_BADGE_CONFIG[project.priority].label}
                             </Badge>
                          </div>
                        </div>
                        {(project.code || project.id) && (
                          <p className="text-sm text-muted-foreground font-mono">
                            {project.code || "N/A"} / {project.id}
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {project.description}
                    </p>
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
                            <p className="text-muted-foreground text-xs">
                              Sponsor:
                            </p>
                            <p className="font-medium text-card-foreground">
                              {project.sponsor}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Pill className="w-4 h-4 text-muted" />
                          <div>
                            <p className="text-muted-foreground text-xs">Drug:</p>
                            <p className="font-medium text-card-foreground">
                              {project.drug}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-muted" />
                          <div>
                            <p className="text-muted-foreground text-xs">
                              Target Date:
                            </p>
                            <p className="font-medium text-card-foreground">
                              {project.targetDate}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted" />
                          <div>
                            <p className="text-muted-foreground text-xs">Team:</p>
                            <p className="font-medium text-card-foreground">
                              {project.teamSize} members
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Team Avatars */}
                    <div className="flex items-center gap-3 pt-2">
                      <div className="flex -space-x-2">
                        {project.teamMembers.slice(0, 3).map((member, index) => (
                          <Avatar
                            key={index}
                            className="w-8 h-8 border-2 border-background"
                          >
                            <AvatarImage
                              src={member.avatar || "/placeholder.svg"}
                            />
                            <AvatarFallback className="text-xs bg-accent/10 text-accent">
                              {member.initials}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {project.teamMembers.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">
                              +{project.teamMembers.length - 3}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-4 border-t border-border mt-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 hover:bg-accent/10 hover:text-accent"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      {project.ownerId === user?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 hover:bg-accent/10 hover:text-accent"
                          data-project-id={project.id}
                          onClick={handleEditProjectClick}
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      )}
                
                      <button
                        disabled={!isResumeEnabled}
                        data-enabled={String(isResumeEnabled)}
                        style={{
                          backgroundColor: isResumeEnabled ? "#8b5cf6" : "#e5e7eb",
                          color: isResumeEnabled ? "#ffffff" : "#9ca3af",
                          cursor: isResumeEnabled ? "pointer" : "not-allowed",
                          opacity: isResumeEnabled ? 1 : 0.6,
                          border: "none",
                          borderRadius: "6px",
                          padding: "8px 12px",
                          fontSize: "14px",
                          fontWeight: "500",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          transition: "background-color 0.2s",
                          flex: "1",
                          minHeight: "32px",
                        }}
                        onMouseEnter={handleResumeMouseEnter}
                        onMouseLeave={handleResumeMouseLeave}
                        onClick={handleResumeClick}
                      >
                        <Play className="w-4 h-4" style={{ color: isResumeEnabled ? "#ffffff" : "#9ca3af" }} />
                        <span style={{ color: isResumeEnabled ? "#ffffff" : "#9ca3af" }}>Resume</span>
                      </button>

                      {project.ownerId === user?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-destructive/10 hover:text-destructive"
                          data-project-id={project.id}
                          onClick={handleDeleteProjectClick}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        {/*IM-61 Pagination */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousPage}
            disabled={page === 1}
          >
            Prev
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>


        {!isLoading && filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No projects found
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>
      {showCreateDialog && (
        <ProjectForm
          onSubmit={handleCreateProject}
          isSubmitting={isCreatingProject}
          submitError={createProjectError}
          onCancel={closeCreateDialog}
        />
      )}
      {showEditDialog && editProject && (
        <ProjectForm
          
          initialData={editProject}
          isEditing
          onSubmit={handleEditProject}
          onCancel={closeEditDialog}
        />
      )}
    </div>
  );
}
