"use client";

import { useAppSelector, useAppDispatch } from "@/lib/store";
import {
  setViewMode,
  setFilters,
  fetchProjects,
  createProject,
  Project,
  ProjectCreation,
  deleteProject,
  updateProject,
  ProjectUpdate,
} from "@/lib/store/slices/projectsSlice";
import { useEffect, useState } from "react";
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
import { ProjectForm } from "./ui/projects/project-form";

//IM-61: Add status info
const statusOptions = [
  { header: "Pre-Submission" },
  { value: "draft", label: "Draft" },
  { value: "pre-ind-meeting-requested", label: "Pre-IND Meeting Requested " },
  { value: "pre-ind-meeting-completed", label: "Pre-IND Meeting Completed " },
  { header: "Submission & Review" },
  { value: "submitted", label: "Submitted " },
  { value: "under-review", label: "Under Review " },
  { value: "active", label: "Active " },
  { header: "Hold States" },
  { value: "clinical-hold-complete", label: "Clinical Hold - Complete " },
  { value: "clinical-hold-partial", label: "Clinical Hold - Partial " },
  { header: "Other States" },
  { value: "inactive", label: "Inactive - No subjects enrolled for 2+ years OR on clinical hold for ≥1 year" },
  { value: "withdrawn", label: "Withdrawn - (can be reactivated)" },
  { value: "terminated", label: "Terminated - (serious deficiencies or inactive ≥5 years)" },
];

const statusConfig = {
  // Pre-Submission
  draft: { label: "Draft", color: "bg-slate-100 text-slate-800 border-slate-200" },
  "pre-ind-meeting-requested": {
    label: "Pre-IND Requested",
    color: "bg-amber-100 text-amber-800 border-amber-200",
  },
  "pre-ind-meeting-completed": {
    label: "Pre-IND Completed",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },

  // Submission & Review
  submitted: { label: "Submitted", color: "bg-blue-100 text-blue-800 border-blue-200" },
  "under-review": { label: "Under Review", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  active: { label: "Active", color: "bg-green-100 text-green-800 border-green-200" },

  // Hold States
  "clinical-hold-complete": {
    label: "Clinical Hold - Complete",
    color: "bg-red-100 text-red-800 border-red-200",
  },
  "clinical-hold-partial": {
    label: "Clinical Hold - Partial",
    color: "bg-orange-100 text-orange-800 border-orange-200",
  },

  // Other States
  inactive: { label: "Inactive", color: "bg-slate-100 text-slate-800 border-slate-200" },
  withdrawn: { label: "Withdrawn", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  terminated: { label: "Terminated", color: "bg-rose-100 text-rose-800 border-rose-200" },
};



const priorityOptions = [
  { value: "all", label: "All Priority" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const priorityConfig = {
  low: { label: "Low", color: "bg-gray-100 text-gray-600" },
  medium: { label: "Medium", color: "bg-amber-100 text-amber-700" },
  high: { label: "High", color: "bg-orange-100 text-orange-700" },
  critical: { label: "Critical", color: "bg-red-100 text-red-700" },
};

export function ProjectsView() {
  const dispatch = useAppDispatch();
  const { projects, viewMode, filters, isLoading } = useAppSelector(
    (state) => state.projects,
  );
  const { teams } = useAppSelector((state) => state.teams);
  const { selectedTeamId } = useAppSelector((state) => state.teams);
  const { user } = useAppSelector((state) => state.auth);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editProject, setEditProject] = useState<ProjectCreation | null>(null);
  //IM-61 add pagination state
  const [page, setPage] = useState(1);
  const pageSize = 6; 
  useEffect(() => setPage(1), [filters]);

  useEffect(() => {
    if (selectedTeamId) {
      dispatch(fetchProjects(selectedTeamId));
    }
  }, [dispatch, selectedTeamId]);

  

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      project.sponsor.toLowerCase().includes(filters.search.toLowerCase()) ||
      project.drug.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus =
      filters.status === "all" || project.status === filters.status;
    const matchesPriority =
      filters.priority === "all" || project.priority === filters.priority;

    return matchesSearch && matchesStatus && matchesPriority;
  });
  //IM-61 pagination state
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const pagedProjects = filteredProjects.slice((page - 1) * pageSize, page * pageSize);


  const handleViewModeChange = (mode: "grid" | "list") => {
    dispatch(setViewMode(mode));
  };

  const handleSearchChange = (search: string) => {
    dispatch(setFilters({ search }));
  };

  const handleStatusFilterChange = (status: string) => {
    dispatch(setFilters({ status }));
  };

  const handlePriorityFilterChange = (priority: string) => {
    dispatch(setFilters({ priority }));
  };

  const handleCreateProject = (data: ProjectCreation) => {
    dispatch(createProject(data));
    setShowCreateDialog(false);
  };

  const handleEditProject = (data: ProjectUpdate) => {
    if (editProject == null || editProject.id == null) return;
    dispatch(
      updateProject({
        projectId: editProject.id,
        updates: { ...data, id: undefined },
      }),
    );
    setShowEditDialog(false);
  };

  const handleDeleteProject = (projectId: string) => {
    if (
      confirm(
        "Are you sure you wish to delete this project? This action cannot be undone.",
      )
    ) {
      dispatch(deleteProject(projectId));
    }
  };

  const handleClickEdit = (projectId: string) => {
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) return;
    setShowEditDialog(true);
    setEditProject({
      id: proj.id,
      team_id: proj.teamId,
      drug_name: proj.drug,
      ind_title: proj.title,
      ind_number: proj.code,
      product_type: proj.productType,
      description: proj.description,
      sponsor_contact_email: proj.sponsorContactEmail,
      sponsor_name: proj.sponsor,
      fda_contact_email: proj.fdaContactEmail,
      project_start_date: proj.projectStartDate,
      pre_ind_meeting_date: proj.preIndMeetingDate,
      target_ind_submission_date: proj.targetIndSubmissionDate,
      additional_notes: proj.additionalNotes,
    });
  };

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
            onClick={() => setShowCreateDialog(true)}
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
                onChange={(e) => handleSearchChange(e.target.value)}
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
                {statusOptions.map((opt, idx) =>
                  opt.header ? (
                    <div key={`hdr-${idx}`} className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-default select-none">
                      {opt.header}
                    </div>
                  ) : (
                    <SelectItem key={opt.value} value={opt.value} className="whitespace-normal text-left">
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
                {priorityOptions.map((opt) => (
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
              onClick={() => handleViewModeChange("grid")}
              className="shadow-sm"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewModeChange("list")}
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
                                className={`${statusConfig[project.status].color} text-xs px-2 py-1 leading-tight whitespace-normal break-words max-w-[240px]`}
                              >
                                {statusConfig[project.status].label}
                              </Badge>
                              <Badge
                                className={`${priorityConfig[project.priority].color} text-xs px-2 py-1 leading-tight whitespace-normal break-words max-w-[160px]`}
                              >
                                {priorityConfig[project.priority].label}
                             </Badge>
                          </div>
                        </div>
                        {project.code && (
                          <p className="text-sm text-muted-foreground font-mono">
                            {project.code}
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
                          onClick={() => handleClickEdit(project.id)}
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      )}
                
                      <button
                        disabled={!isResumeEnabled}
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
                        onMouseEnter={(e) => {
                          if (isResumeEnabled) e.currentTarget.style.backgroundColor = "#7c3aed";
                        }}
                        onMouseLeave={(e) => {
                          if (isResumeEnabled) e.currentTarget.style.backgroundColor = "#8b5cf6";
                        }}
                        onClick={() => {
                          if (isResumeEnabled) console.log("Resume clicked");
                        }}
                      >
                        <Play className="w-4 h-4" style={{ color: isResumeEnabled ? "#ffffff" : "#9ca3af" }} />
                        <span style={{ color: isResumeEnabled ? "#ffffff" : "#9ca3af" }}>Resume</span>
                      </button>

                      {project.ownerId === user?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDeleteProject(project.id)}
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
            onClick={() => setPage((p) => Math.max(1, p - 1))}
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
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
          teams={teams}
          onSubmit={handleCreateProject}
          onCancel={() => setShowCreateDialog(false)}
        />
      )}
      {showEditDialog && editProject && (
        <ProjectForm
          teams={teams}
          initialData={editProject}
          isEditing
          onSubmit={handleEditProject}
          onCancel={() => setShowEditDialog(false)}
        />
      )}
    </div>
  );
}
