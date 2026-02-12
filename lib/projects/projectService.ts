import { createBrowserClient } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/client";
import type { ProjectCreation, ProjectUpdate } from "@/lib/projects/types";
import type { Database } from "@/lib/supabase/schema";
import { isAdminEmail } from "@/lib/utils";
import {
  getTenantNameFromMetadata,
  type ProjectAssignmentRow,
} from "@/lib/projects/projectMapper";

const DEFAULT_DOC_REPOSITORY_BUCKET = "doc-repository-dev";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

type UserRow = {
  tenantid?: string;
  email?: string;
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

const fetchUserContext = async (
  userId: string,
): Promise<{ userData: UserRow; isAdmin: boolean }> => {
  const supabase = createClient();
  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("tenantid,email")
    .eq("id", userId)
    .single();

  if (userError) {
    throw userError;
  }

  const userData: UserRow = {
    tenantid:
      typeof userRow?.tenantid === "string" ? userRow.tenantid : undefined,
    email: typeof userRow?.email === "string" ? userRow.email : undefined,
  };
  return {
    userData,
    isAdmin: isAdminEmail(userData?.email),
  };
};

export const fetchVisibleProjectRowsForUser = async ({
  userId,
  requireAssignmentsForNonAdmin,
}: {
  userId: string;
  requireAssignmentsForNonAdmin: boolean;
}): Promise<{
  rows: ProjectRow[];
  assignmentRows: ProjectAssignmentRow[];
  fallbackTenantId: string | null;
}> => {
  const supabase = createClient();
  const { userData, isAdmin } = await fetchUserContext(userId);

  if (!isAdmin && !userData?.tenantid) {
    return {
      rows: [],
      assignmentRows: [],
      fallbackTenantId: null,
    };
  }

  const { data: assignments, error: assignError } = await supabase
    .from("user_project")
    .select("project_id, role")
    .eq("user_id", userId);

  if (assignError) {
    throw assignError;
  }

  const assignmentRows: ProjectAssignmentRow[] = (assignments ?? []).flatMap(
    (assignment) =>
      assignment.project_id
        ? [{ project_id: assignment.project_id, role: assignment.role ?? null }]
        : [],
  );
  const assignedIds = assignmentRows.map((assignment) => assignment.project_id);

  if (!isAdmin && requireAssignmentsForNonAdmin && assignedIds.length === 0) {
    return {
      rows: [],
      assignmentRows,
      fallbackTenantId: userData.tenantid ?? null,
    };
  }

  let query = supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (!isAdmin && assignedIds.length > 0) {
    query = query.in("id", assignedIds);
  }

  const { data: projects, error } = await query;
  if (error) {
    throw error;
  }

  return {
    rows: projects ?? [],
    assignmentRows,
    fallbackTenantId: userData.tenantid ?? null,
  };
};

export const getCurrentAuthenticatedUserId = async (): Promise<string | null> => {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  return user?.id ?? null;
};

export const fetchProjectRowById = async (projectId: string): Promise<ProjectRow> => {
  const supabase = createBrowserClient();
  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error) {
    throw error;
  }

  return project;
};

export const createProjectRowWithOwnerAssignment = async ({
  projectData,
  userId,
}: {
  projectData: ProjectCreation;
  userId: string;
}): Promise<ProjectRow> => {
  const supabase = createBrowserClient();

  if (!projectData.ind_title) {
    throw new Error("Project title required");
  }

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("tenantid")
    .eq("id", userId)
    .single();

  if (userError) {
    throw userError;
  }

  const userData = userRow;
  if (!userData?.tenantid) {
    throw new Error("User has no tenant");
  }

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

  if (error) {
    throw error;
  }

  if (!newProject?.id) {
    throw new Error("Failed to create project");
  }

  const { error: assignmentError } = await supabase.from("user_project").insert({
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

  return newProject;
};

export const updateProjectRowById = async ({
  projectId,
  updates,
}: {
  projectId: string;
  updates: ProjectUpdate;
}): Promise<ProjectRow> => {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", projectId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const deleteProjectById = async (projectId: string): Promise<void> => {
  const supabase = createBrowserClient();

  const { error } = await supabase.from("projects").delete().eq("id", projectId);

  if (error) {
    throw error;
  }
};
