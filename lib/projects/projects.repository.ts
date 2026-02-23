// Author: Bin Lee
// Email: binlee120@gmail.com

import { createBrowserClient } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/schema";
import { z } from "zod";
import {
  authGetUserResponseSchema,
  projectFolderResponseSchema,
  projectRowSchema,
  projectRowsSchema,
  userProjectAssignmentRowSchema,
  userTenantAndEmailRowSchema,
} from "@/lib/projects/projects.schemas";

const DEFAULT_DOC_REPOSITORY_BUCKET = "doc-repository-dev";

export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
export type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];
type UserProjectRole = Database["public"]["Enums"]["user_roles"];

export type UserProjectAssignmentRow = {
  project_id: string;
  role: UserProjectRole | null;
};

const USER_PROJECT_ROLES: ReadonlySet<UserProjectRole> = new Set([
  "regulatory_owner",
  "admin",
  "regulatory_writer_medical_writer",
  "guest",
  "qa_specialist",
  "regulatory_reviewer",
  "legal_reviewer",
  "document_management_specialist",
]);

const normalizeUserProjectRole = (value: unknown): UserProjectRole | null => {
  if (typeof value !== "string") return null;
  return USER_PROJECT_ROLES.has(value as UserProjectRole)
    ? (value as UserProjectRole)
    : null;
};

export const createProjectFolderStructure = async ({
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

  const parsedPayload =
    payload && typeof payload === "object"
      ? projectFolderResponseSchema.parse(payload)
      : payload;

  if (!response.ok) {
    const message =
      (parsedPayload as { error?: string; message?: string })?.error ||
      (parsedPayload as { error?: string; message?: string })?.message ||
      "Failed to create S3 project folders";
    throw new Error(message);
  }
};

export const fetchUserTenantAndEmail = async (userId: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .select("tenantid,email")
    .eq("id", userId)
    .single();

  if (error) {
    throw error;
  }

  const parsed = userTenantAndEmailRowSchema.parse(data ?? {});
  return {
    tenantid: parsed.tenantid ?? undefined,
    email: parsed.email ?? undefined,
  };
};

export const fetchUserTenantId = async (userId: string) => {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from("users")
    .select("tenantid")
    .eq("id", userId)
    .single();

  if (error) {
    throw error;
  }

  const parsed = userTenantAndEmailRowSchema.parse(data ?? {});
  return parsed.tenantid ?? null;
};

export const fetchUserProjectAssignments = async (
  userId: string,
): Promise<UserProjectAssignmentRow[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_project")
    .select("project_id, role")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  const parsedAssignments = z.array(userProjectAssignmentRowSchema).parse(data ?? []);
  return parsedAssignments.flatMap((assignment) =>
    assignment.project_id
      ? [
          {
            project_id: assignment.project_id,
            role: normalizeUserProjectRole(assignment.role),
          },
        ]
      : [],
  );
};

export const fetchProjectRows = async ({
  projectIds,
}: {
  projectIds?: string[];
} = {}): Promise<ProjectRow[]> => {
  const supabase = createClient();
  let query = supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (projectIds?.length) {
    query = query.in("id", projectIds);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return projectRowsSchema.parse(data ?? []) as ProjectRow[];
};

export const fetchCurrentAuthenticatedUserId = async (): Promise<string | null> => {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  const parsedAuth = authGetUserResponseSchema.parse({
    data: { user: user ?? null },
    error: error ?? null,
  });
  return parsedAuth.data.user?.id ?? null;
};

export const fetchProjectById = async (projectId: string): Promise<ProjectRow> => {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error) {
    throw error;
  }

  return projectRowSchema.parse(data) as ProjectRow;
};

export const insertProjectRow = async (project: ProjectInsert): Promise<ProjectRow> => {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from("projects")
    .insert(project)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return projectRowSchema.parse(data) as ProjectRow;
};

export const insertUserProjectAssignment = async (
  assignment: Database["public"]["Tables"]["user_project"]["Insert"],
): Promise<void> => {
  const supabase = createBrowserClient();
  const { error } = await supabase.from("user_project").insert(assignment);

  if (error) {
    throw error;
  }
};

export const updateProjectRow = async ({
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

  return projectRowSchema.parse(data) as ProjectRow;
};

export const deleteProjectRow = async (projectId: string): Promise<void> => {
  const supabase = createBrowserClient();
  const { error } = await supabase.from("projects").delete().eq("id", projectId);

  if (error) {
    throw error;
  }
};
