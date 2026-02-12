// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import type { ProjectCreation, ProjectUpdate } from "@/lib/projects/types";
import type { Database } from "@/lib/supabase/schema";
import { isAdminEmail } from "@/lib/utils";
import {
  getTenantNameFromMetadata,
  type ProjectAssignmentRow,
} from "@/lib/projects/projectMapper";
import {
  createProjectFolderStructure,
  deleteProjectRow,
  fetchCurrentAuthenticatedUserId as fetchCurrentAuthenticatedUserIdFromRepository,
  fetchProjectById,
  fetchProjectRows,
  fetchUserProjectAssignments,
  fetchUserTenantAndEmail,
  fetchUserTenantId,
  insertProjectRow,
  insertUserProjectAssignment,
  updateProjectRow,
} from "@/lib/projects/projects.repository";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

type UserRow = {
  tenantid?: string;
  email?: string;
};

const fetchUserContext = async (
  userId: string,
): Promise<{ userData: UserRow; isAdmin: boolean }> => {
  const userData = await fetchUserTenantAndEmail(userId);
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
  const { userData, isAdmin } = await fetchUserContext(userId);

  if (!isAdmin && !userData?.tenantid) {
    return {
      rows: [],
      assignmentRows: [],
      fallbackTenantId: null,
    };
  }

  const assignmentRows: ProjectAssignmentRow[] = await fetchUserProjectAssignments(
    userId,
  );
  const assignedIds = assignmentRows.map((assignment) => assignment.project_id);

  if (!isAdmin && requireAssignmentsForNonAdmin && assignedIds.length === 0) {
    return {
      rows: [],
      assignmentRows,
      fallbackTenantId: userData.tenantid ?? null,
    };
  }

  const rows =
    !isAdmin && assignedIds.length > 0
      ? await fetchProjectRows({ projectIds: assignedIds })
      : await fetchProjectRows();

  return {
    rows,
    assignmentRows,
    fallbackTenantId: userData.tenantid ?? null,
  };
};

export const getCurrentAuthenticatedUserId = async (): Promise<string | null> =>
  fetchCurrentAuthenticatedUserIdFromRepository();

export const fetchProjectRowById = async (projectId: string): Promise<ProjectRow> =>
  fetchProjectById(projectId);

export const createProjectRowWithOwnerAssignment = async ({
  projectData,
  userId,
}: {
  projectData: ProjectCreation;
  userId: string;
}): Promise<ProjectRow> => {
  if (!projectData.ind_title) {
    throw new Error("Project title required");
  }

  const tenantId = await fetchUserTenantId(userId);
  if (!tenantId) {
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
    getTenantNameFromMetadata(normalizedProjectData.metadata) || tenantId;

  await createProjectFolderStructure({
    tenantName,
    projectName: normalizedProjectData.ind_title,
  });

  const newProject = await insertProjectRow({
    ...normalizedProjectData,
    project_creator_id: userId,
    tenantid: tenantId,
  });

  if (!newProject?.id) {
    throw new Error("Failed to create project");
  }

  try {
    await insertUserProjectAssignment({
      project_id: newProject.id,
      user_id: userId,
      created_by: userId,
      role: "admin",
    });
  } catch (assignmentError) {
    try {
      await deleteProjectRow(newProject.id);
    } catch (rollbackError) {
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
}): Promise<ProjectRow> =>
  updateProjectRow({
    projectId,
    updates,
  });

export const deleteProjectById = async (projectId: string): Promise<void> =>
  deleteProjectRow(projectId);
