import type { ProjectCreation } from "@/lib/projects/types";

export const TEAM_ROLE_OWNER = "owner";
export const TEAM_ROLE_OPTIONS = [
  { value: "cmc_lead", label: "CMC Leader" },
  { value: "clinical_lead", label: "Clinical Lead" },
  { value: "preclinical_lead", label: "Preclinical Lead" },
  { value: "regulatory_owner", label: "Regulatory Owner" },
  { value: "publisher", label: "Publisher" },
  { value: "tech_writer", label: "Tech Writer" },
  { value: "ind_writer", label: "IND Writer" },
] as const;

export type TeamAssignableRole = (typeof TEAM_ROLE_OPTIONS)[number]["value"];

export type TeamMemberRow = {
  id: string;
  userId: string;
  role: TeamAssignableRole | typeof TEAM_ROLE_OWNER | "";
};

export const createTeamRowId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const parseTeamAssignmentsFromMetadata = (
  metadata: unknown,
): { tech_writer?: string; ind_writer?: string; inc_writer?: string } => {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }
  const teamAssignments = (
    metadata as { team_assignments?: unknown }
  ).team_assignments;
  if (
    !teamAssignments ||
    typeof teamAssignments !== "object" ||
    Array.isArray(teamAssignments)
  ) {
    return {};
  }
  const source = teamAssignments as Record<string, unknown>;
  return {
    tech_writer:
      typeof source.tech_writer === "string" ? source.tech_writer : undefined,
    ind_writer:
      typeof source.ind_writer === "string" ? source.ind_writer : undefined,
    inc_writer:
      typeof source.inc_writer === "string" ? source.inc_writer : undefined,
  };
};

export const buildTeamRows = (
  source: ProjectCreation | undefined,
  ownerUserId: string,
): TeamMemberRow[] => {
  const rows: TeamMemberRow[] = [
    {
      id: createTeamRowId(),
      userId: ownerUserId,
      role: TEAM_ROLE_OWNER,
    },
  ];

  const knownRoleKeys = [
    "cmc_lead",
    "clinical_lead",
    "preclinical_lead",
    "regulatory_owner",
    "publisher",
  ] as const satisfies ReadonlyArray<keyof ProjectCreation>;

  knownRoleKeys.forEach((role) => {
    const assignedUserId = source?.[role];
    if (typeof assignedUserId === "string" && assignedUserId.trim()) {
      rows.push({
        id: createTeamRowId(),
        userId: assignedUserId,
        role,
      });
    }
  });

  const metadataAssignments = parseTeamAssignmentsFromMetadata(source?.metadata);
  if (metadataAssignments.tech_writer) {
    rows.push({
      id: createTeamRowId(),
      userId: metadataAssignments.tech_writer,
      role: "tech_writer",
    });
  }

  const indWriterUserId =
    metadataAssignments.ind_writer || metadataAssignments.inc_writer;
  if (indWriterUserId) {
    rows.push({
      id: createTeamRowId(),
      userId: indWriterUserId,
      role: "ind_writer",
    });
  }

  return rows;
};

export const isTeamRowsValid = (rows: TeamMemberRow[]) =>
  rows.every((row) => {
    if (row.role === TEAM_ROLE_OWNER) return true;
    return Boolean(row.userId && row.role);
  });

export const getAssignedUserByRole = (
  rows: TeamMemberRow[],
  role: TeamAssignableRole,
) => {
  const row = rows.find((memberRow) => memberRow.role === role);
  if (!row?.userId.trim()) return null;
  return row.userId.trim();
};

export const normalizeProjectSubmissionData = ({
  projectData,
  tenantMeta,
  teamRows,
}: {
  projectData: ProjectCreation;
  tenantMeta?: { id: string; name?: string } | null;
  teamRows: TeamMemberRow[];
}): ProjectCreation => {
  const baseMetadata =
    projectData.metadata &&
    typeof projectData.metadata === "object" &&
    !Array.isArray(projectData.metadata)
      ? (projectData.metadata as Record<string, unknown>)
      : {};
  const nextData = tenantMeta
    ? { ...projectData, metadata: { ...baseMetadata, tenant: tenantMeta } }
    : projectData;

  const normalizedData = {
    ...nextData,
    sponsor_contact_email:
      typeof nextData.sponsor_contact_email === "string"
        ? nextData.sponsor_contact_email.trim()
        : nextData.sponsor_contact_email,
    fda_contact_email:
      typeof nextData.fda_contact_email === "string" &&
        !nextData.fda_contact_email.trim()
        ? null
        : typeof nextData.fda_contact_email === "string"
          ? nextData.fda_contact_email.trim()
          : nextData.fda_contact_email,
  };

  const techWriterUserId = getAssignedUserByRole(teamRows, "tech_writer");
  const indWriterUserId = getAssignedUserByRole(teamRows, "ind_writer");

  const normalizedMetadata =
    normalizedData.metadata &&
    typeof normalizedData.metadata === "object" &&
    !Array.isArray(normalizedData.metadata)
      ? (normalizedData.metadata as Record<string, unknown>)
      : {};
  const existingTeamAssignments = parseTeamAssignmentsFromMetadata(
    normalizedMetadata,
  );
  const mergedTeamAssignments = {
    ...existingTeamAssignments,
    ...(techWriterUserId ? { tech_writer: techWriterUserId } : {}),
    ...(indWriterUserId
      ? { ind_writer: indWriterUserId, inc_writer: indWriterUserId }
      : {}),
  };

  return {
    ...normalizedData,
    cmc_lead: getAssignedUserByRole(teamRows, "cmc_lead"),
    clinical_lead: getAssignedUserByRole(teamRows, "clinical_lead"),
    preclinical_lead: getAssignedUserByRole(teamRows, "preclinical_lead"),
    regulatory_owner: getAssignedUserByRole(teamRows, "regulatory_owner"),
    publisher: getAssignedUserByRole(teamRows, "publisher"),
    metadata: {
      ...normalizedMetadata,
      team_assignments: mergedTeamAssignments,
    },
  };
};
