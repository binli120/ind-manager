import type { Project } from "@/lib/projects/types";
import type { Database } from "@/lib/supabase/schema";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

export type ProjectAssignmentRow = {
  project_id: string;
  role?: Database["public"]["Enums"]["user_roles"] | null;
};

export const getTenantNameFromMetadata = (metadata: unknown): string | null => {
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

export const getWriterAssignmentsFromMetadata = (metadata: unknown) => {
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

const normalizeSettings = (
  project: ProjectRow,
  preferStoredSettings: boolean,
): Project["settings"] => {
  if (!preferStoredSettings) {
    return {
      isPublic: false,
      allowCollaboration: true,
    };
  }

  const rawSettings = (
    project as unknown as {
      settings?: { isPublic?: boolean; allowCollaboration?: boolean };
    }
  ).settings;

  return {
    isPublic: rawSettings?.isPublic ?? false,
    allowCollaboration: rawSettings?.allowCollaboration ?? true,
  };
};

export const dbToClientProject = ({
  project,
  fallbackTenantId,
  userRole,
  preferStoredSettings = false,
}: {
  project: ProjectRow;
  fallbackTenantId?: string | null;
  userRole?: Database["public"]["Enums"]["user_roles"] | null;
  preferStoredSettings?: boolean;
}): Project => {
  const { techWriter, indWriter } = getWriterAssignmentsFromMetadata(
    project.metadata,
  );

  return {
    ...project,
    title: project.ind_title,
    code: project.ind_number || "",
    description: project.description || "No description available",
    status: project.status as Project["status"],
    priority: project.priority as Project["priority"],
    progress: project.progress || 0,
    sponsor: project.sponsor_name || "",
    drug: project.drug_name || "",
    targetDate: project.target_ind_submission_date || "",
    tenantId: project.tenantid ?? fallbackTenantId ?? "",
    ownerId: project.project_creator_id ?? "",
    teamSize: 0,
    teamMembers: [],
    createdAt: project.created_at,
    updatedAt: project.updated_at,
    settings: normalizeSettings(project, preferStoredSettings),
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
    userRole: userRole ?? null,
  };
};

export const mapProjectRowsToProjects = ({
  rows,
  assignmentRows,
  fallbackTenantId,
}: {
  rows: ProjectRow[];
  assignmentRows?: ProjectAssignmentRow[];
  fallbackTenantId?: string | null;
}) => {
  const roleByProjectId = new Map(
    (assignmentRows ?? []).map((assignment) => [
      assignment.project_id,
      assignment.role ?? null,
    ]),
  );

  return rows.map((project) =>
    dbToClientProject({
      project,
      fallbackTenantId,
      userRole: roleByProjectId.get(project.id) ?? null,
    }),
  );
};
