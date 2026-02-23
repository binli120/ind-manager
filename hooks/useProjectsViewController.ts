// Author: Bin Lee
// Email: binlee120@gmail.com

import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  DELETE_PROJECT_CONFIRMATION_MESSAGE,
  PROJECTS_PAGE_SIZE,
} from "@/lib/projects/constants";
import {
  createProject,
  deleteProject,
  fetchProjects,
  setFilters,
  setViewMode,
  updateProject,
} from "@/lib/store/slices";
import type { ProjectCreation, ProjectUpdate } from "@/lib/projects/types";
import {
  filterProjects,
  mapProjectToEditFormData,
  paginateProjects,
  toProjectSubmitError,
} from "@/lib/projects/projectViewModel";
import { useAsyncTask } from "@/hooks/useAsyncTask";

export function useProjectsViewController() {
  const dispatch = useAppDispatch();
  const { viewMode, filters, projects, isLoading } = useAppSelector(
    (state) => state.projects,
  );
  const { user } = useAppSelector((state) => state.auth);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editProject, setEditProject] = useState<ProjectCreation | null>(null);
  const [page, setPage] = useState(1);
  const createProjectTask = useAsyncTask(
    async (data: ProjectCreation) => {
      await dispatch(createProject(data)).unwrap();
    },
    undefined,
    { mapError: toProjectSubmitError },
  );

  useEffect(() => {
    if (!user?.id) return;
    void dispatch(fetchProjects({ userId: user.id }));
  }, [dispatch, user?.id]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const filteredProjects = useMemo(
    () => filterProjects(projects, filters),
    [projects, filters],
  );

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / PROJECTS_PAGE_SIZE));
  const pagedProjects = useMemo(
    () => paginateProjects(filteredProjects, page, PROJECTS_PAGE_SIZE),
    [filteredProjects, page],
  );

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

  const openCreateDialog = () => {
    createProjectTask.reset();
    setShowCreateDialog(true);
  };

  const closeCreateDialog = () => {
    if (createProjectTask.isLoading) return;
    createProjectTask.reset();
    setShowCreateDialog(false);
  };

  const handleCreateProject = async (data: ProjectCreation) => {
    const result = await createProjectTask.run(data);
    if (!result.error) {
      setShowCreateDialog(false);
      setPage(1);
      return;
    }

    throw new Error(result.error);
  };

  const closeEditDialog = () => {
    setShowEditDialog(false);
  };

  const handleEditProject = async (updates: ProjectUpdate) => {
    if (!editProject?.id) return;
    await dispatch(
      updateProject({
        projectId: editProject.id,
        updates: { ...updates, id: undefined },
      }),
    ).unwrap();
    setShowEditDialog(false);
  };

  const handleDeleteProject = (projectId: string) => {
    if (!confirm(DELETE_PROJECT_CONFIRMATION_MESSAGE)) return;
    void dispatch(deleteProject(projectId));
  };

  const openEditDialog = (projectId: string) => {
    const project = projects.find((entry) => entry.id === projectId);
    if (!project) return;
    setEditProject(mapProjectToEditFormData(project));
    setShowEditDialog(true);
  };

  const goToPreviousPage = () => {
    setPage((current) => Math.max(1, current - 1));
  };

  const goToNextPage = () => {
    setPage((current) => Math.min(totalPages, current + 1));
  };

  return {
    user,
    viewMode,
    filters,
    isLoading,
    showCreateDialog,
    isCreatingProject: createProjectTask.isLoading,
    createProjectError: createProjectTask.error,
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
  };
}
