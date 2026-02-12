import {
  dbToClientProject,
  mapProjectRowsToProjects,
} from "@/lib/projects/projectMapper";
import {
  createProjectRowWithOwnerAssignment,
  deleteProjectById,
  fetchVisibleProjectRowsForUser,
  getCurrentAuthenticatedUserId,
  updateProjectRowById,
} from "@/lib/projects/projectService";
import type { Project, ProjectCreation, ProjectUpdate } from "@/lib/projects/types";

export async function fetchProjects(tenantId?: string, userId?: string): Promise<Project[]> {
  const resolvedUserId = userId ?? (await getCurrentAuthenticatedUserId());
  if (!resolvedUserId) {
    return [];
  }

  const { rows, assignmentRows, fallbackTenantId } =
    await fetchVisibleProjectRowsForUser({
      userId: resolvedUserId,
      requireAssignmentsForNonAdmin: false,
    });

  const scopedRows = tenantId
    ? rows.filter((row) => row.tenantid === tenantId)
    : rows;

  return mapProjectRowsToProjects({
    rows: scopedRows,
    assignmentRows,
    fallbackTenantId,
  });
}

export async function createProject(
  project: Partial<ProjectCreation>,
  tenantId: string,
  userId: string,
) {
  if (
    !project.ind_title ||
    !project.drug_name ||
    !project.product_type ||
    !project.sponsor_contact_email
  ) {
    throw new Error("Missing required project fields");
  }

  const created = await createProjectRowWithOwnerAssignment({
    projectData: {
      ...project,
      tenantid: tenantId,
    } as ProjectCreation,
    userId,
  });

  return dbToClientProject({ project: created });
}

export async function updateProject(id: string, updates: Partial<ProjectUpdate>) {
  const updated = await updateProjectRowById({
    projectId: id,
    updates: updates as ProjectUpdate,
  });

  return dbToClientProject({ project: updated });
}

export async function deleteProject(id: string) {
  await deleteProjectById(id);
  return id;
}
