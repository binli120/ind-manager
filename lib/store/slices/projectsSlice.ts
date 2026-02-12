// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import { createBrowserClient } from "@/lib/supabase";
import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/schema";
import { getErrorMessage, isAdminEmail } from "@/lib/utils";
import { logoutUser } from "./authSlice";

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
  tenantId: string;
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
    team_assignments?: {
      tech_writer?: string;
      ind_writer?: string;
      inc_writer?: string;
    };
  };
  targetIndSubmissionDate: string;
  preIndMeetingDate: string | null;
  projectStartDate: string;
  fdaContactEmail: string | null;
  sponsorContactEmail: string;
  additionalNotes: string | null;
  productType: string;
  cmcLead?: string | null;
  clinicalLead?: string | null;
  preclinicalLead?: string | null;
  regulatoryOwner?: string | null;
  publisher?: string | null;
  techWriter?: string | null;
  indWriter?: string | null;
  userRole?: Database["public"]["Enums"]["user_roles"] | null;
}

export type ProjectCreation =
  Database["public"]["Tables"]["projects"]["Insert"];

export type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];


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

const DEFAULT_DOC_REPOSITORY_BUCKET = "doc-repository-dev";

const getTenantNameFromMetadata = (metadata: unknown): string | null => {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const tenant = (metadata as { tenant?: unknown }).tenant;
  if (!tenant || typeof tenant !== "object" || Array.isArray(tenant)) {
    return null;
  }

  const tenantName = (tenant as { name?: unknown }).name;
  return typeof tenantName === "string" && tenantName.trim()
    ? tenantName.trim()
    : null;
};

const getWriterAssignmentsFromMetadata = (metadata: unknown) => {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return { techWriter: null, indWriter: null };
  }

  const teamAssignments = (
    metadata as { team_assignments?: unknown }
  ).team_assignments;
  if (
    !teamAssignments ||
    typeof teamAssignments !== "object" ||
    Array.isArray(teamAssignments)
  ) {
    return { techWriter: null, indWriter: null };
  }

  const source = teamAssignments as Record<string, unknown>;
  const techWriter =
    typeof source.tech_writer === "string" ? source.tech_writer : null;
  const indWriter =
    typeof source.ind_writer === "string"
      ? source.ind_writer
      : typeof source.inc_writer === "string"
        ? source.inc_writer
        : null;

  return { techWriter, indWriter };
};

const createProjectFolderStructure = async ({
  tenantName,
  projectName,
}: {
  tenantName: string;
  projectName: string;
}) => {
  const response = await fetch("/api/s3/new-project", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      bucket:
        process.env.NEXT_PUBLIC_DOC_REPOSITORY_BUCKET ||
        DEFAULT_DOC_REPOSITORY_BUCKET,
      tenant_name: tenantName,
      project_name: projectName,
    }),
  });

  const raw = await response.text();
  let payload: unknown = null;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    payload = raw;
  }

  if (!response.ok) {
    const message =
      (payload as { error?: string; message?: string })?.error ||
      (payload as { error?: string; message?: string })?.message ||
      "Failed to create S3 project folders";
    throw new Error(message);
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
      // MOCK: update if you keep mock mode
      /*
      if (useMockProjects && tenantId === MOCK_TEAM_ID) {
        const response = await fetch(
          `/api/mock/projects${tenantId ? `?tenantId=${tenantId}` : ""}`,
          { cache: "no-store" },
        );
        if (!response.ok) throw new Error("Failed to load mock projects");
        const { data } = await response.json();
        return data as Project[];
      }
      */
      const supabase = createClient();

      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("tenantid,email")
        .eq("id", userId)
        .single();

      if (userError) throw userError;
      const userData = userRow as { email?: string; tenantid?: string };
      const isAdmin = isAdminEmail(userData?.email);
      if (!isAdmin && !userData?.tenantid) return [];

      // fetch assignments & roles from user_project
      const { data: assignments, error: assignError } = await supabase
        .from("user_project")
        .select("project_id, role")
        .eq("user_id", userId);
      if (assignError) throw assignError;
      const assignmentRows =
        (assignments ?? []) as {
          project_id: string;
          role?: Database["public"]["Enums"]["user_roles"] | null;
        }[];
      const assignedIds = assignmentRows.map((a) => a.project_id);

      let query = supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false });

      if (!isAdmin && assignedIds.length > 0) {
        query = query.in("id", assignedIds);
      }

      const { data: projects, error } = await query;

      if (error) throw error;
      
      const rows = (projects ?? []) as Database["public"]["Tables"]["projects"]["Row"][];

      const transformedProjects: Project[] =
        rows.map((project) => {
          const { techWriter, indWriter } = getWriterAssignmentsFromMetadata(
            project.metadata,
          );
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
            tenantId: project.tenantid ?? userData?.tenantid ?? "",
            ownerId: project.project_creator_id ?? "",
            teamSize: 0,
            teamMembers: [],
            createdAt: project.created_at,
            updatedAt: project.updated_at,
            settings:{
              isPublic: false,
              allowCollaboration: true,
            },
            metadata: project.metadata as Project["metadata"],
            targetIndSubmissionDate: project.target_ind_submission_date ?? "",
            preIndMeetingDate: project.pre_ind_meeting_date,
            projectStartDate: project.project_start_date ?? "",
            fdaContactEmail: project.fda_contact_email,
            sponsorContactEmail: project.sponsor_contact_email,
            additionalNotes: project.additional_notes,
            productType: project.product_type,
            cmcLead: project.cmc_lead,
            clinicalLead: project.clinical_lead,
            preclinicalLead: project.preclinical_lead,
            regulatoryOwner: project.regulatory_owner,
            publisher: project.publisher,
            techWriter,
            indWriter,
            userRole: assignmentRows.find((a) => a.project_id === project.id)
              ?.role ?? null,
          };
        }) || [];

      return transformedProjects;
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
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user?.id) return [];

      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("tenantid,email")
        .eq("id", user.id)
        .single();

      if (userError) throw userError;
      const userData = userRow as { email?: string; tenantid?: string };
      const isAdmin = isAdminEmail(userData?.email);
      if (!isAdmin && !userData?.tenantid) return [];

      const { data: assignments, error: assignError } = await supabase
        .from("user_project")
        .select("project_id, role")
        .eq("user_id", user.id);
      if (assignError) throw assignError;
      const assignmentRows =
        (assignments ?? []) as { project_id: string; role?: string | null }[];
      const assignedIds = assignmentRows.map((a) => a.project_id);

      if (!isAdmin && assignedIds.length === 0) return [];

      let query = supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false });

      if (!isAdmin) {
        query = query.in("id", assignedIds);
      }

      const { data: projects, error } = await query;
      if (error) throw error;

      const rows = (projects ?? []) as Database["public"]["Tables"]["projects"]["Row"][];
      const transformedProjects: Project[] =
        rows.map((project) => {
          const { techWriter, indWriter } = getWriterAssignmentsFromMetadata(
            project.metadata,
          );
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
            tenantId: project.tenantid ?? userData?.tenantid ?? "",
            ownerId: project.project_creator_id ?? "",
            teamSize: 0,
            teamMembers: [],
            createdAt: project.created_at,
            updatedAt: project.updated_at,
            settings: {
              isPublic: false,
              allowCollaboration: true,
            },
            metadata: project.metadata as Project["metadata"],
            targetIndSubmissionDate: project.target_ind_submission_date ?? "",
            preIndMeetingDate: project.pre_ind_meeting_date,
            projectStartDate: project.project_start_date ?? "",
            fdaContactEmail: project.fda_contact_email,
            sponsorContactEmail: project.sponsor_contact_email,
            additionalNotes: project.additional_notes,
            productType: project.product_type,
            cmcLead: project.cmc_lead,
            clinicalLead: project.clinical_lead,
            preclinicalLead: project.preclinical_lead,
            regulatoryOwner: project.regulatory_owner,
            publisher: project.publisher,
            techWriter,
            indWriter,
            userRole: assignmentRows.find((a) => a.project_id === project.id)
              ?.role as Project["userRole"],
          };
        }) || [];

      return transformedProjects;
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
      const supabase = createBrowserClient();

      const { data: project, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) throw error;
      const { techWriter, indWriter } = getWriterAssignmentsFromMetadata(
        project.metadata,
      );

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
        tenantId: project.tenantid ?? "",
        ownerId: project.project_creator_id ?? "",
        teamSize: 0,
        teamMembers: [],
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        settings: {
          isPublic:
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (project as any).settings?.isPublic ?? false,
          allowCollaboration:
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (project as any).settings?.allowCollaboration ?? true,
        },
        metadata: (project.metadata as Project["metadata"]) ?? {},
        targetIndSubmissionDate: project.target_ind_submission_date ?? "",
        preIndMeetingDate: project.pre_ind_meeting_date,
        projectStartDate: project.project_start_date ?? "",
        fdaContactEmail: project.fda_contact_email,
        sponsorContactEmail: project.sponsor_contact_email,
        additionalNotes: project.additional_notes,
        productType: project.product_type,
        cmcLead: project.cmc_lead,
        clinicalLead: project.clinical_lead,
        preclinicalLead: project.preclinical_lead,
        regulatoryOwner: project.regulatory_owner,
        publisher: project.publisher,
        techWriter,
        indWriter,
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
      const supabase = createBrowserClient();
      const state = getState() as {
        auth: { user: { id: string } | null };
      };
      const userId = state.auth.user?.id;

      if (!userId) throw new Error("User not authenticated");
      if (!projectData.ind_title) throw new Error("Project title required");

      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("tenantid")
        .eq("id", userId)
        .single();

      if (userError) throw userError;
      const userData = userRow as { tenantid?: string };
      if (!userData?.tenantid) throw new Error("User has no tenant");

      const normalizedProjectData: ProjectCreation = {
        ...projectData,
        fda_contact_email:
          typeof projectData.fda_contact_email === "string" &&
            !projectData.fda_contact_email.trim()
            ? null
            : projectData.fda_contact_email,
      };

      const tenantName =
        getTenantNameFromMetadata(normalizedProjectData.metadata) ||
        userData.tenantid;

      await createProjectFolderStructure({
        tenantName,
        projectName: normalizedProjectData.ind_title,
      });

      const { data: newProject, error } = await supabase
        .from("projects")
        .insert({
          ...normalizedProjectData,
          project_creator_id: userId,
          tenantid: userData.tenantid,
        })
        .select()
        .single();

      if (error) throw error;
      if (!newProject?.id) throw new Error("Failed to create project");

      const { error: assignmentError } = await supabase
        .from("user_project")
        .insert({
          project_id: newProject.id,
          user_id: userId,
          created_by: userId,
          role: "admin",
        });

      if (assignmentError) {
        const { error: rollbackError } = await supabase
          .from("projects")
          .delete()
          .eq("id", newProject.id);

        if (rollbackError) {
          console.error("Failed to rollback project after assignment error", {
            projectId: newProject.id,
            rollbackError,
            assignmentError,
          });
        }
        throw assignmentError;
      }

      const writerAssignments = getWriterAssignmentsFromMetadata(
        normalizedProjectData.metadata,
      );
      const writerColumnsPayload: Record<string, unknown> = {};
      if (writerAssignments.techWriter) {
        writerColumnsPayload.tech_writer = writerAssignments.techWriter;
      }
      if (writerAssignments.indWriter) {
        writerColumnsPayload.ind_writer = writerAssignments.indWriter;
        writerColumnsPayload.inc_writer = writerAssignments.indWriter;
      }
      if (Object.keys(writerColumnsPayload).length > 0) {
        // Best-effort backfill in case DB has writer columns not reflected in generated types.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const projectsTable = supabase.from("projects") as any;
        const { error: writerColumnsError } = await projectsTable
          .update(writerColumnsPayload)
          .eq("id", newProject.id);

        if (writerColumnsError) {
          console.warn("Writer columns update skipped", {
            projectId: newProject.id,
            writerColumnsError,
          });
        }
      }

      return newProject;
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
      const supabase = createBrowserClient();
      console.log("updating: ", projectId, updates);

      const { data, error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", projectId)
        .select()
        .single();

      if (error) throw error;

      const writerAssignments = getWriterAssignmentsFromMetadata(
        updates.metadata,
      );
      const writerColumnsPayload: Record<string, unknown> = {};
      if (writerAssignments.techWriter) {
        writerColumnsPayload.tech_writer = writerAssignments.techWriter;
      }
      if (writerAssignments.indWriter) {
        writerColumnsPayload.ind_writer = writerAssignments.indWriter;
        writerColumnsPayload.inc_writer = writerAssignments.indWriter;
      }
      if (Object.keys(writerColumnsPayload).length > 0) {
        // Best-effort backfill in case DB has writer columns not reflected in generated types.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const projectsTable = supabase.from("projects") as any;
        const { error: writerColumnsError } = await projectsTable
          .update(writerColumnsPayload)
          .eq("id", projectId);

        if (writerColumnsError) {
          console.warn("Writer columns update skipped", {
            projectId,
            writerColumnsError,
          });
        }
      }

      return data;
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
      const supabase = createBrowserClient();

      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

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

        if (state.selectedProjectId) {
          state.currentProject = state.projects.find((project) =>
            project.id === state.selectedProjectId
          ) || null;

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

        if (state.projects.length > 0) {
          state.currentProject = state.projects[0];
          state.selectedProjectId = state.projects[0].id;
        } else {
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
        state.selectedProjectId = null;
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

const dbToClientProject = (
  project: ProjectCreation & { id: string },
): Project => {
  const { techWriter, indWriter } = getWriterAssignmentsFromMetadata(
    project.metadata,
  );
  return {
    ...project,
    description: project.description ?? "",
    tenantId: project.tenantid ?? "",
    title: project.ind_title,
    code: project.ind_number ?? "",
    sponsor: project.sponsor_name ?? "",
    ownerId: project.project_creator_id ?? "",
    targetDate: project.target_ind_submission_date ?? "",
    drug: project.drug_name ?? "",
    createdAt: project.created_at ?? "",
    updatedAt: project.updated_at ?? "",
    teamMembers: [],
    teamSize: 0,
    status: (project.status ?? "draft") as Project["status"],
    priority: (project.priority ?? "low") as Project["priority"],
    progress: project.progress ?? 0,
    metadata: (project.metadata as Project["metadata"]) ?? {},
        settings: {
          allowCollaboration: false,
          isPublic: false,
        },
    projectStartDate: project.project_start_date ?? "",
    fdaContactEmail: project.fda_contact_email ?? null,
    additionalNotes: project.additional_notes ?? null,
    preIndMeetingDate: project.pre_ind_meeting_date ?? null,
    productType: project.product_type ?? "",
    sponsorContactEmail: project.sponsor_contact_email ?? "",
    targetIndSubmissionDate: project.target_ind_submission_date ?? "",
    cmcLead: project.cmc_lead ?? null,
    clinicalLead: project.clinical_lead ?? null,
    preclinicalLead: project.preclinical_lead ?? null,
    regulatoryOwner: project.regulatory_owner ?? null,
    publisher: project.publisher ?? null,
    techWriter,
    indWriter,
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
  hydrateSelectedProjectFromStorage,
} = projectsSlice.actions;

export default projectsSlice.reducer;
