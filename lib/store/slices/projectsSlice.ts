import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/schema";

export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  name: string;
  avatar?: string | null;
  initials: string;
  role: "lead" | "member" | "viewer";
  joinedAt: string;
}

export interface Project {
  id: string;
  title: string;
  code: string;
  description: string;
  //IM-61 add more status
  status: 
  | "draft"
  | "pre-ind-meeting-requested"
  | "pre-ind-meeting-completed"
  | "submitted"
  | "under-review"
  | "active"
  | "clinical-hold-complete"
  | "clinical-hold-partial"
  | "inactive"
  | "withdrawn"
  | "terminated";
  priority: "low" | "medium" | "high" | "critical";
  progress: number;
  sponsor: string;
  drug: string;
  targetDate: string;
  teamId: string;
  ownerId: string;
  teamSize: number;
  teamMembers: ProjectMember[];
  createdAt: string;
  updatedAt: string;
  settings: {
    isPublic: boolean;
    allowCollaboration: boolean;
  };
  metadata?: {
    phase?: string;
    indication?: string;
    studyType?: string;
    regulatoryPath?: string;
  };
  targetIndSubmissionDate: string;
  preIndMeetingDate: string | null;
  projectStartDate: string;
  fdaContactEmail: string | null;
  sponsorContactEmail: string;
  additionalNotes: string | null;
  productType: string;
}

export type ProjectCreation =
  Database["public"]["Tables"]["projects"]["Insert"];

export type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];

interface ProjectFilters {
  search: string;
  status: string;
  priority: string;
  teamId?: string;
}

interface ProjectsState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  filters: ProjectFilters;
  viewMode: "grid" | "list";
  selectedProjectId: string | null;
}

const initialState: ProjectsState = {
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
  filters: {
    search: "",
    status: "all",
    priority: "all",
  },
  viewMode: "grid",
  selectedProjectId: null,
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error";
};

// MOCK: Remove mock mode when Supabase projects are live.
const useMockProjects = true;
const MOCK_TEAM_ID = "demo-team"
// Async thunks
export const fetchProjects = createAsyncThunk(
  "projects/fetchProjects",
  async (teamId: string | null, { rejectWithValue }) => {
    try {
      // MOCK: Remove mock branch once Supabase data is wired up.
      if (useMockProjects && teamId === MOCK_TEAM_ID) {
        try {
          const response = await fetch(
            `/api/mock/projects${teamId ? `?teamId=${teamId}` : ""}`,
            { cache: "no-store" },
          );

          if (!response.ok) throw new Error("Failed to load mock projects");

          const { data } = await response.json();
          return data as Project[];
        } catch (error) {
          return rejectWithValue(
            error instanceof Error ? error.message : "Mock project fetch failed",
          );
        }
      }
      //END MOCK


      const supabase = createClient();

      let query = supabase.from("projects").select(`
          *,
          teams (
            user_teams (
              user_id,
              role,
              joined_at,
              users (
                name,
                avatar_url
              )
            )
          ),
          settings:project_settings (
            isPublic:is_public,
            allowCollaboration:allow_collaboration
          )
        `);

      if (teamId) {
        query = query.eq("team_id", teamId);
      }

      const { data: projects, error } = await query.order("updated_at", {
        ascending: false,
      });

      if (error) throw error;

      const transformedProjects: Project[] =
        projects?.map((project) => {
          const members: ProjectMember[] =
            project.teams?.user_teams?.map((member) => ({
              id: member.user_id,
              userId: member.user_id,
              projectId: project.id,
              name: member.users?.name || "Unknown User",
              avatar: member.users?.avatar_url,
              initials:
                member.users?.name
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("") || "U",
              role: member.role as ProjectMember["role"],
              joinedAt: member.joined_at,
            })) || [];

          return {
            id: project.id,
            title: project.ind_title,
            code: project.ind_number || "",
            description: project.description || "No description available",
            status: project.status as Project["status"],
            priority: project.priority as Project["priority"],
            progress: project.progress || 0,
            sponsor: project.sponsor_name || "",
            drug: project.drug_name || "",
            targetDate: project.target_ind_submission_date || "",
            teamId: project.team_id,
            ownerId: project.project_creator_id ?? "",
            teamSize: members.length,
            teamMembers: members,
            createdAt: project.created_at,
            updatedAt: project.updated_at,
            settings: project.settings || {
              isPublic: false,
              allowCollaboration: true,
            },
            metadata: {},
            targetIndSubmissionDate: project.target_ind_submission_date,
            preIndMeetingDate: project.pre_ind_meeting_date,
            projectStartDate: project.project_start_date,
            fdaContactEmail: project.fda_contact_email,
            sponsorContactEmail: project.sponsor_contact_email,
            additionalNotes: project.additional_notes,
            productType: project.product_type,
          };
        }) || [];

      return transformedProjects;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error) || "Failed to fetch projects");
    }
  },
);

export const fetchProjectDetails = createAsyncThunk(
  "projects/fetchProjectDetails",
  async (projectId: string, { rejectWithValue }) => {
    try {
      const supabase = createClient();

      const { data: project, error } = await supabase
        .from("projects")
        .select(
          `
          *,
          settings:project_settings (
            allowCollaboration:allow_collaboration,
            isPublic:is_public
          ),
          teams (
            user_teams (
              team_id,
              user_id,
              role,
              joined_at,
              users (
                name,
                avatar_url
              )
            )
          )
        `,
        )
        .eq("id", projectId)
        .single();

      if (error) throw error;

      const members: ProjectMember[] =
        project.teams.user_teams?.map((member) => ({
          id: member.user_id,
          userId: member.user_id,
          projectId: project.id,
          name: member.users?.name || "Unknown User",
          avatar: member.users?.avatar_url,
          initials:
            member.users?.name
              ?.split(" ")
              .map((n: string) => n[0])
              .join("") || "U",
          role: member.role as ProjectMember["role"],
          joinedAt: member.joined_at,
        })) || [];

      const transformedProject: Project = {
        id: project.id,
        title: project.ind_title,
        code: project.ind_number || "",
        description: project.description || "No description available",
        status: project.status as Project["status"],
        priority: project.priority as Project["priority"],
        progress: project.progress || 0,
        sponsor: project.sponsor_name || "",
        drug: project.drug_name || "",
        targetDate: project.target_ind_submission_date || "",
        teamId: project.team_id,
        ownerId: project.project_creator_id ?? "",
        teamSize: members.length,
        teamMembers: members,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        settings: project.settings || {
          isPublic: false,
          allowCollaboration: true,
        },
        metadata: (project.metadata as Project["metadata"]) ?? {},
        targetIndSubmissionDate: project.target_ind_submission_date,
        preIndMeetingDate: project.pre_ind_meeting_date,
        projectStartDate: project.project_start_date,
        fdaContactEmail: project.fda_contact_email,
        sponsorContactEmail: project.sponsor_contact_email,
        additionalNotes: project.additional_notes,
        productType: project.product_type,
      };

      return transformedProject;
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
      const supabase = createClient();
      const state = getState() as {
        auth: { user: { id: string } | null };
      };
      const userId = state.auth.user?.id;

      if (!userId) throw new Error("User not authenticated");
      if (!projectData.ind_title) throw new Error("Project title required");

      const DEFAULT_TEAM_ID = "demo-team";
      const teamId = projectData.team_id || DEFAULT_TEAM_ID;

      const { data: newProject, error } = await supabase
        .from("projects")
        .insert({ ...projectData, project_creator_id: userId, team_id: teamId })
        .select()
        .single();

      if (error) throw error;

      // Add creator as project lead
      // Project members = team members for now
      // const { error: memberError } = await supabase
      //   .from("project_members")
      //   .insert({
      //     project_id: project.id,
      //     user_id: userId,
      //     role: "lead",
      //   });

      // if (memberError) throw memberError;

      return newProject;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error) || "Failed to create project");
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
      const supabase = createClient();
      console.log("updating: ", projectId, updates);

      const { data, error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", projectId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error) || "Failed to update project");
    }
  },
);

export const deleteProject = createAsyncThunk(
  "projects/deleteProject",
  async (projectId: string, { rejectWithValue }) => {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

      return projectId;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error) || "Failed to delete project");
    }
  },
);

export const addProjectMember = createAsyncThunk(
  "projects/addProjectMember",
  async (
    {
      projectId,
      userId,
      role,
    }: {
      projectId: string;
      userId: string;
      role: "lead" | "member" | "viewer";
    },
    { rejectWithValue },
  ) => {
    try {
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
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error) || "Failed to add project member");
    }
  },
);

export const removeProjectMember = createAsyncThunk(
  "projects/removeProjectMember",
  async (memberId: string, { rejectWithValue }) => {
    try {
      const supabase = createClient();

      // TODO: Fix query, team member = project member?
      const { error } = await supabase
        .from("project_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      return memberId;
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
      state.currentProject =
        state.projects.find((project) => project.id === action.payload) || null;
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
        state.projects = action.payload;

        if (state.selectedProjectId) {
          state.currentProject =
            state.projects.find(project => project.id === state.selectedProjectId) || null;

          if (!state.currentProject && state.projects.length > 0) {
            state.currentProject = state.projects[0];
            state.selectedProjectId = state.projects[0].id;
          }
        } else if (state.projects.length > 0) {
          state.currentProject = state.projects[0];
          state.selectedProjectId = state.projects[0].id;
        }
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch project details
      .addCase(fetchProjectDetails.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchProjectDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProject = action.payload;

        // Update project in projects array
        const index = state.projects.findIndex(
          (project) => project.id === action.payload.id,
        );
        if (index !== -1) {
          state.projects[index] = action.payload;
        }
      })
      .addCase(fetchProjectDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create project
      .addCase(createProject.fulfilled, (state, action) => {
        const proj = action.payload;
        const newProject: Project = dbToClientProject(proj);
        state.projects.unshift(newProject);
        state.currentProject = newProject;
        state.selectedProjectId = newProject.id;
      })
      .addCase(createProject.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Update project
      .addCase(updateProject.fulfilled, (state, action) => {
        const index = state.projects.findIndex(
          (project) => project.id === action.payload.id,
        );
        if (index !== -1) {
          state.projects[index] = {
            ...dbToClientProject(action.payload),
          };
        }
        if (state.currentProject?.id === action.payload.id) {
          state.currentProject = {
            ...dbToClientProject(action.payload),
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
        const member: ProjectMember = {
          id: action.payload.id,
          userId: action.payload.user_id,
          projectId: action.payload.project_id,
          name: action.payload.profiles?.name || "Unknown User",
          avatar: action.payload.profiles?.avatar_url,
          initials:
            action.payload.profiles?.name
              ?.split(" ")
              .map((n: string) => n[0])
              .join("") || "U",
          role: action.payload.role,
          joinedAt: action.payload.created_at,
        };

        // Update current project
        if (state.currentProject?.id === action.payload.project_id) {
          state.currentProject.teamMembers.push(member);
          state.currentProject.teamSize += 1;
        }

        // Update project in projects array
        const projectIndex = state.projects.findIndex(
          (project) => project.id === action.payload.project_id,
        );
        if (projectIndex !== -1) {
          state.projects[projectIndex].teamMembers.push(member);
          state.projects[projectIndex].teamSize += 1;
        }
      })
      // Remove project member
      .addCase(removeProjectMember.fulfilled, (state, action) => {
        // Update current project
        if (state.currentProject) {
          state.currentProject.teamMembers =
            state.currentProject.teamMembers.filter(
              (member) => member.id !== action.payload,
            );
          state.currentProject.teamSize = Math.max(
            0,
            state.currentProject.teamSize - 1,
          );
        }

        // Update projects array
        state.projects.forEach((project) => {
          project.teamMembers = project.teamMembers.filter(
            (member) => member.id !== action.payload,
          );
          project.teamSize = Math.max(0, project.teamSize - 1);
        });
      });
  },
});

const dbToClientProject = (
  project: ProjectCreation & { id: string },
  settings?: Database["public"]["Tables"]["project_settings"]["Row"],
): Project => {
  return {
    ...project,
    description: project.description ?? "",
    teamId: project.team_id,
    title: project.ind_title,
    code: project.ind_number ?? "",
    sponsor: project.sponsor_name,
    ownerId: project.project_creator_id ?? "",
    targetDate: project.target_ind_submission_date,
    drug: project.drug_name,
    createdAt: project.created_at ?? "",
    updatedAt: project.updated_at ?? "",
    teamMembers: [],
    teamSize: 1,
    status: (project.status ?? "draft") as Project["status"],
    priority: (project.priority ?? "low") as Project["priority"],
    progress: project.progress ?? 0,
    metadata: project.metadata as Project["metadata"],
    settings: {
      allowCollaboration: settings?.allow_collaboration ?? false,
      isPublic: settings?.is_public ?? false,
    },
    projectStartDate: project.project_start_date,
    fdaContactEmail: project.fda_contact_email,
    additionalNotes: project.additional_notes,
    preIndMeetingDate: project.pre_ind_meeting_date,
    productType: project.product_type,
    sponsorContactEmail: project.sponsor_contact_email,
    targetIndSubmissionDate: project.target_ind_submission_date,
  };
};

export const {
  setCurrentProject,
  setSelectedProjectId,
  setViewMode,
  setFilters,
  clearFilters,
  clearError,
  updateProjectLocally,
  hydrateSelectedProjectFromStorage
} = projectsSlice.actions;

export default projectsSlice.reducer;
