// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { Project, ProjectCreation, ProjectMember, ProjectUpdate } from "@/lib/projects/types";
import {
  dbToClientProject,
  mapProjectRowsToProjects,
} from "@/lib/projects/projectMapper";
import {
  createProjectRowWithOwnerAssignment,
  deleteProjectById,
  fetchProjectRowById,
  fetchVisibleProjectRowsForUser,
  getCurrentAuthenticatedUserId,
  updateProjectRowById,
} from "@/lib/projects/projectService";
import { getErrorMessage } from "@/lib/utils";
import { logoutUser } from "./authSlice";

export type { Project, ProjectCreation, ProjectMember, ProjectUpdate } from "@/lib/projects/types";


interface ProjectFilters {
  search: string;
  status: string;
  priority: string;
  tenantId?: string;
}

interface ProjectsState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  hasLoadedOnce: boolean;
  error: string | null;
  filters: ProjectFilters;
  viewMode: "grid" | "list";
  selectedProjectId: string | null;
}

const initialState: ProjectsState = {
  projects: [],
  currentProject: null,
  isLoading: false,
  hasLoadedOnce: false,
  error: null,
  filters: {
    search: "",
    status: "all",
    priority: "all",
  },
  viewMode: "grid",
  selectedProjectId: null,
};

const getPersistedSelectedProjectId = (userId?: string) => {
  if (typeof window === "undefined") return null;
  try {
    if (userId) {
      const userScoped = localStorage.getItem(`selectedProjectId:${userId}`);
      if (userScoped) return userScoped;
    }
    return localStorage.getItem("selectedProjectId");
  } catch {
    return null;
  }
};

// MOCK: Remove mock mode when Supabase projects are live.
//const useMockProjects = true;
//const MOCK_TENANT_ID = "demo-tenant";
// Async thunks
export const fetchProjects = createAsyncThunk(
  "projects/fetchProjects",
  async ({ userId }: { userId: string }, { rejectWithValue }) => {
    try {
      const { rows, assignmentRows, fallbackTenantId } =
        await fetchVisibleProjectRowsForUser({
          userId,
          requireAssignmentsForNonAdmin: false,
        });

      return mapProjectRowsToProjects({
        rows,
        assignmentRows,
        fallbackTenantId,
      });
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error) || "Failed to fetch projects",
      );
    }
  },
);

export const fetchProjectsForCurrentUser = createAsyncThunk(
  "projects/fetchProjectsForCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const userId = await getCurrentAuthenticatedUserId();
      if (!userId) {
        return [];
      }

      const { rows, assignmentRows, fallbackTenantId } =
        await fetchVisibleProjectRowsForUser({
          userId,
          requireAssignmentsForNonAdmin: true,
        });

      return mapProjectRowsToProjects({
        rows,
        assignmentRows,
        fallbackTenantId,
      });
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error) || "Failed to fetch projects for current user",
      );
    }
  },
);


export const fetchProjectDetails = createAsyncThunk(
  "projects/fetchProjectDetails",
  async (projectId: string, { rejectWithValue }) => {
    try {
      const project = await fetchProjectRowById(projectId);
      return dbToClientProject({
        project,
        preferStoredSettings: true,
      });
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error) || "Failed to fetch project details",
      );
    }
  },
);

export const createProject = createAsyncThunk(
  "projects/createProject",
  async (projectData: ProjectCreation, { rejectWithValue, getState }) => {
    try {
      const state = getState() as {
        auth: { user: { id: string } | null };
      };
      const userId = state.auth.user?.id;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      const newProject = await createProjectRowWithOwnerAssignment({
        projectData,
        userId,
      });

      return dbToClientProject({ project: newProject });
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error) || "Failed to create project",
      );
    }
  },
);


export const updateProject = createAsyncThunk(
  "projects/updateProject",
  async (
    { projectId, updates }: { projectId: string; updates: ProjectUpdate },
    { rejectWithValue },
  ) => {
    try {
      const updated = await updateProjectRowById({
        projectId,
        updates,
      });

      return dbToClientProject({ project: updated });
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error) || "Failed to update project",
      );
    }
  },
);

export const deleteProject = createAsyncThunk(
  "projects/deleteProject",
  async (projectId: string, { rejectWithValue }) => {
    try {
      await deleteProjectById(projectId);
      return projectId;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error) || "Failed to delete project",
      );
    }
  },
);

export const addProjectMember = createAsyncThunk(
  "projects/addProjectMember",
  async (
    {}: {
      projectId: string;
      userId: string;
      role: "lead" | "member" | "viewer";
    },
    { rejectWithValue },
  ) => {
    try {
      throw new Error("Members management temporarily stopped");

      /*
      const supabase = createClient();

      // TODO: Fix query, team member = project member?
      const { data, error } = await supabase
        .from("project_members")
        .insert({
          project_id: projectId,
          user_id: userId,
          role,
        })
        .select(
          `
          *,
          profiles (
            name,
            avatar_url
          )
        `,
        )
        .single();

      if (error) throw error;

      return data;
      */
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error) || "Failed to add project member",
      );
    }
  },
);

export const removeProjectMember = createAsyncThunk(
  "projects/removeProjectMember",
  async (memberId: string, { rejectWithValue }) => {
    try {
      throw new Error("Members management temporarily stopped");
      /*
      const supabase = createClient();

      // TODO: Fix query, team member = project member?
      const { error } = await supabase
        .from("project_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      return memberId;
      */
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error) || "Failed to remove project member",
      );
    }
  },
);

const projectsSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    setCurrentProject: (state, action: PayloadAction<Project | null>) => {
      state.currentProject = action.payload;
      state.selectedProjectId = action.payload?.id || null;
    },
    setSelectedProjectId: (state, action: PayloadAction<string | null>) => {
      state.selectedProjectId = action.payload;
      state.currentProject = state.projects.find((project) =>
        project.id === action.payload
      ) || null;
    },
    setViewMode: (state, action: PayloadAction<"grid" | "list">) => {
      state.viewMode = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<ProjectFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        search: "",
        status: "all",
        priority: "all",
      };
    },
    clearError: (state) => {
      state.error = null;
    },
    updateProjectLocally: (
      state,
      action: PayloadAction<Partial<Project> & { id: string }>,
    ) => {
      const index = state.projects.findIndex(
        (project) => project.id === action.payload.id,
      );
      if (index !== -1) {
        state.projects[index] = { ...state.projects[index], ...action.payload };
      }
      if (state.currentProject?.id === action.payload.id) {
        state.currentProject = { ...state.currentProject, ...action.payload };
      }
    },
    hydrateSelectedProjectFromStorage: (state) => {
      const saved = typeof window !== "undefined"
        ? localStorage.getItem("selectedProjectId")
        : null;
      state.selectedProjectId = saved ?? null;
      // current project fixed up
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch projects
      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.hasLoadedOnce = true;
        state.projects = action.payload;
        const persistedSelection = getPersistedSelectedProjectId(
          action.meta.arg.userId,
        );
        const preferredProjectId = persistedSelection ?? state.selectedProjectId;

        if (preferredProjectId) {
          state.currentProject =
            state.projects.find((project) => project.id === preferredProjectId) ?? null;
          state.selectedProjectId = state.currentProject?.id ?? null;
        }

        if (!state.currentProject && state.projects.length > 0) {
          state.currentProject = state.projects[0];
          state.selectedProjectId = state.projects[0].id;
        }
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.hasLoadedOnce = true;
        state.error = action.payload as string;
        console.error("fetchProjects failed:", action.payload ?? action.error.message);
      })
      // Fetch projects for current user
      .addCase(fetchProjectsForCurrentUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjectsForCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.hasLoadedOnce = true;
        state.projects = action.payload;

        const preferredProjectId =
          state.selectedProjectId ?? getPersistedSelectedProjectId();
        if (preferredProjectId) {
          state.currentProject =
            state.projects.find((project) => project.id === preferredProjectId) ?? null;
          state.selectedProjectId = state.currentProject?.id ?? null;
        }

        if (!state.currentProject && state.projects.length > 0) {
          state.currentProject = state.projects[0];
          state.selectedProjectId = state.projects[0].id;
        }

        if (state.projects.length === 0) {
          state.currentProject = null;
          state.selectedProjectId = null;
        }
      })
      .addCase(fetchProjectsForCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.hasLoadedOnce = true;
        state.error = (action.payload as string) || null;
      })
      // Clear projects on logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.projects = [];
        state.currentProject = null;
        state.isLoading = false;
        state.hasLoadedOnce = false;
        state.error = null;
      })
      // Fetch project details
      .addCase(fetchProjectDetails.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchProjectDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        const existing = state.projects.find(
          (project) => project.id === action.payload.id,
        );
        const merged: Project = {
          ...(existing ?? {}),
          ...action.payload,
          tenantId: action.payload.tenantId || existing?.tenantId || "",
          userRole: action.payload.userRole ?? existing?.userRole ?? null,
        };
        state.currentProject = merged;

        // Update project in projects array
        const index = state.projects.findIndex(
          (project) => project.id === action.payload.id,
        );
        if (index !== -1) {
          state.projects[index] = merged;
        }
      })
      .addCase(fetchProjectDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create project
      .addCase(createProject.fulfilled, (state, action) => {
        const newProject = action.payload;
        state.projects.unshift(newProject);
        state.currentProject = newProject;
        state.selectedProjectId = newProject.id;
      })
      .addCase(createProject.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Update project
      .addCase(updateProject.fulfilled, (state, action) => {
        const updatedProject = action.payload;
        const index = state.projects.findIndex(
          (project) => project.id === updatedProject.id,
        );
        if (index !== -1) {
          state.projects[index] = {
            ...updatedProject,
            userRole: state.projects[index].userRole ?? updatedProject.userRole ?? null,
          };
        }
        if (state.currentProject?.id === updatedProject.id) {
          state.currentProject = {
            ...updatedProject,
            userRole: state.currentProject.userRole ?? updatedProject.userRole ?? null,
          };
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Delete project
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.projects = state.projects.filter(
          (project) => project.id !== action.payload,
        );
        if (state.currentProject?.id === action.payload) {
          state.currentProject = null;
          state.selectedProjectId = null;
        }
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Add project member
      .addCase(addProjectMember.fulfilled, (state, action) => {
        const payload = action.payload as {
          id?: string
          user_id?: string
          project_id?: string
          profiles?: { name?: string; avatar_url?: string }
          role?: ProjectMember["role"]
          created_at?: string
        };
        if (!payload?.id) return;
        const member: ProjectMember = {
          id: payload.id,
          userId: payload.user_id ?? "",
          projectId: payload.project_id ?? "",
          name: payload.profiles?.name || "Unknown User",
          avatar: payload.profiles?.avatar_url,
          initials: payload.profiles?.name
            ?.split(" ")
            .map((n: string) => n[0])
            .join("") || "U",
          role: payload.role ?? "member",
          joinedAt: payload.created_at ?? new Date().toISOString(),
        };

        // Update current project
        const current = state.currentProject;
        if (current && current.id === payload.project_id) {
          current.teamMembers.push(member);
          current.teamSize += 1;
        }

        // Update project in projects array
        const projectIndex = state.projects.findIndex(
          (project) => project.id === payload.project_id,
        );
        if (projectIndex !== -1) {
          state.projects[projectIndex].teamMembers.push(member);
          state.projects[projectIndex].teamSize += 1;
        }
      })
      // Remove project member
      .addCase(removeProjectMember.fulfilled, (state, action) => {
        if (typeof action.payload !== "string") return;
        const removedId = action.payload;
        // Update current project
        if (state.currentProject) {
          state.currentProject.teamMembers = state.currentProject.teamMembers
            .filter(
              (member) => member.id !== removedId,
            );
          state.currentProject.teamSize = Math.max(
            0,
            state.currentProject.teamSize - 1,
          );
        }

        // Update projects array
        state.projects.forEach((project) => {
          project.teamMembers = project.teamMembers.filter(
            (member) => member.id !== removedId,
          );
          project.teamSize = Math.max(0, project.teamSize - 1);
        });
      });
  },
});

export const {
  setCurrentProject,
  setSelectedProjectId,
  setViewMode,
  setFilters,
  clearFilters,
  clearError,
  updateProjectLocally,
  hydrateSelectedProjectFromStorage,
} = projectsSlice.actions;

export default projectsSlice.reducer;
