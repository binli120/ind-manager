import type { Project } from "@/lib/projects/types";

interface DbProject {
  id: string;
  ind_title: string;
  ind_number: string;
  description: string;
  status: string;
  priority: string;
  progress: number;
  sponsor_name: string;
  drug_name: string;
  target_ind_submission_date: string;
  project_creator_id: string;
  created_at?: string;
  updated_at?: string;
  project_start_date: string;
  pre_ind_meeting_date: string;
  fda_contact_email: string;
  sponsor_contact_email: string;
  additional_notes: string;
  product_type: string;
  tenantid: string;
}

type DbAction = "select" | "insert" | "update" | "delete";
interface DbQueryData {
  select?: string;
  values?: Partial<DbProject>;
}

const DB_COLS: (keyof DbProject)[] = [
  "ind_title",
  "ind_number",
  "description",
  "status",
  "priority",
  "progress",
  "sponsor_name",
  "drug_name",
  "target_ind_submission_date",
  "project_start_date",
  "pre_ind_meeting_date",
  "fda_contact_email",
  "sponsor_contact_email",
  "additional_notes",
  "product_type",
];

const dbRequest = async (
  action: DbAction,
  data: DbQueryData = {},
  filters: Record<string, string> = {}
) => {
  const res = await fetch("/api/database", {
    method: "POST",
    body: JSON.stringify({ table: "projects", action, data, filters }),
  });
  const { data: result, error } = await res.json();
  if (error) throw error;
  return (result as DbProject[]) || [];
};

const mapToProject = (row: DbProject): Project => ({
  id: row.id,
  title: row.ind_title,
  code: row.ind_number,
  description: row.description,
  status: row.status as Project["status"],
  priority: row.priority as Project["priority"],
  progress: row.progress,
  sponsor: row.sponsor_name,
  drug: row.drug_name,
  targetDate: row.target_ind_submission_date,
  tenantId: row.tenantid,
  ownerId: row.project_creator_id,
  teamSize: 0,
  teamMembers: [],
  createdAt: row.created_at ?? "",
  updatedAt: row.updated_at ?? "",
  settings: {
    isPublic: false,
    allowCollaboration: true,
  },
  projectStartDate: row.project_start_date,
  preIndMeetingDate: row.pre_ind_meeting_date,
  targetIndSubmissionDate: row.target_ind_submission_date,
  fdaContactEmail: row.fda_contact_email,
  sponsorContactEmail: row.sponsor_contact_email,
  additionalNotes: row.additional_notes,
  productType: row.product_type,
});

async function getUserProjectIds(userId: string): Promise<string[]> {
  const res = await fetch("/api/database", {
    method: "POST",
    body: JSON.stringify({
      table: "user_project",
      action: "select",
      data: { select: "project_id" },
      filters: { user_id: userId },
    }),
  });
  const { data } = await res.json();
  return data ? data.map((row: {project_id: string}) => row.project_id) : [];
}

export async function fetchProjects(tenantId?: string, userId?: string) {
  const data = await dbRequest(
    "select",
    { select: "*" },
    tenantId ? { tenantid: tenantId } : {}
  );

  if (userId) {
    const assignedIds = await getUserProjectIds(userId);
    return data
      .filter((p) => assignedIds.includes(p.id))
      .map(mapToProject);
  }

  return data.map(mapToProject);
}

export async function createProject(
  project: Partial<DbProject>,
  tenantId: string,
  userId: string
) {
  const cleanValues = DB_COLS.reduce((acc, key) => {
    if (project[key] !== undefined) {
      (acc as Record<string, unknown>)[key] = project[key];
    }
    return acc;
  }, {} as Partial<DbProject>);

  const values: Partial<DbProject> = {
    ...cleanValues,
    tenantid: tenantId,
    project_creator_id: userId,
    status: "draft",
    priority: "medium",
    progress: 0,
  };

  const [row] = await dbRequest("insert", { values });
  if (!row) throw new Error("Failed to create project");
  return mapToProject(row);
}

export async function updateProject(id: string, updates: Partial<DbProject>) {
  const values = DB_COLS.reduce((acc, key) => {
    if (updates[key] !== undefined) {
      (acc as Record<string, unknown>)[key] = updates[key];
    }
    return acc;
  }, {} as Partial<DbProject>);

  const [row] = await dbRequest("update", { values }, { id });
  return row ? mapToProject(row) : null;
}

export async function deleteProject(id: string) {
  await dbRequest("delete", {}, { id });
  return id;
}
