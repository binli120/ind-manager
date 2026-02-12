import type { Database } from "@/lib/supabase/schema";
import type { ProjectCreation } from "@/lib/projects/types";
import { createBrowserClient } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/client";
import { isAdminEmail } from "@/lib/utils";
import {
  createProjectRowWithOwnerAssignment,
  fetchVisibleProjectRowsForUser,
  getCurrentAuthenticatedUserId,
} from "../projectService";

jest.mock("@/lib/supabase", () => ({
  createBrowserClient: jest.fn(),
}));

jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(),
}));

jest.mock("@/lib/utils", () => ({
  isAdminEmail: jest.fn(),
}));

const mockedCreateBrowserClient = createBrowserClient as jest.MockedFunction<
  typeof createBrowserClient
>;
const mockedCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockedIsAdminEmail = isAdminEmail as jest.MockedFunction<typeof isAdminEmail>;

const baseProjectRow: Database["public"]["Tables"]["projects"]["Row"] = {
  additional_notes: null,
  clinical_lead: null,
  cmc_lead: null,
  created_at: "2026-01-01T00:00:00.000Z",
  description: "desc",
  drug_name: "LT3114",
  fda_contact_email: null,
  id: "proj-1",
  ind_number: "IND-123",
  ind_title: "Lpathomab IND",
  metadata: null,
  pre_ind_meeting_date: "2026-02-01",
  preclinical_lead: null,
  priority: "medium",
  product_type: "mab",
  progress: 0,
  project_creator_id: "user-1",
  project_start_date: "2026-01-01",
  publisher: null,
  regulatory_owner: null,
  sponsor_contact_email: "sponsor@example.com",
  sponsor_name: "Filynai",
  status: "draft",
  target_ind_submission_date: "2027-01-01",
  tenantid: "tenant-1",
  updated_at: "2026-01-02T00:00:00.000Z",
};

describe("lib/projects/projectService", () => {
  const fetchMock = jest.fn();

  beforeAll(() => {
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.mockReset();
    mockedIsAdminEmail.mockReturnValue(false);
  });

  it("creates folder + project + owner assignment and backfills writer columns", async () => {
    const usersSingle = jest.fn().mockResolvedValue({
      data: { tenantid: "tenant-1" },
      error: null,
    });
    const projectsInsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: {
            ...baseProjectRow,
            metadata: {
              team_assignments: {
                tech_writer: "writer-tech",
                ind_writer: "writer-ind",
              },
            },
          },
          error: null,
        }),
      }),
    });
    const projectsUpdateEq = jest.fn().mockResolvedValue({ error: null });
    const projectsUpdate = jest.fn().mockReturnValue({ eq: projectsUpdateEq });
    const userProjectInsert = jest.fn().mockResolvedValue({ error: null });

    const supabaseMock = {
      from: jest.fn((table: string) => {
        if (table === "users") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: usersSingle,
              }),
            }),
          };
        }

        if (table === "projects") {
          return {
            insert: projectsInsert,
            update: projectsUpdate,
            delete: jest.fn().mockReturnValue({ eq: jest.fn() }),
          };
        }

        if (table === "user_project") {
          return {
            insert: userProjectInsert,
          };
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    };

    mockedCreateBrowserClient.mockReturnValue(
      supabaseMock as unknown as ReturnType<typeof createBrowserClient>,
    );

    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ ok: true }),
    });

    const projectData: ProjectCreation = {
      ind_title: "Lpathomab IND",
      drug_name: "LT3114",
      product_type: "mab",
      sponsor_contact_email: "sponsor@example.com",
      fda_contact_email: "   ",
      metadata: {
        tenant: {
          name: "filynai.com",
        },
        team_assignments: {
          tech_writer: "writer-tech",
          ind_writer: "writer-ind",
        },
      },
    };

    const created = await createProjectRowWithOwnerAssignment({
      projectData,
      userId: "user-1",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/s3/new-project",
      expect.objectContaining({ method: "POST" }),
    );
    const fetchBody = JSON.parse(
      (fetchMock.mock.calls[0][1] as RequestInit).body as string,
    );
    expect(fetchBody).toMatchObject({
      tenant_name: "filynai.com",
      project_name: "Lpathomab IND",
      bucket: "doc-repository-dev",
    });

    expect(projectsInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        project_creator_id: "user-1",
        tenantid: "tenant-1",
        fda_contact_email: null,
      }),
    );

    expect(userProjectInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: "proj-1",
        user_id: "user-1",
        role: "admin",
      }),
    );

    expect(projectsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        tech_writer: "writer-tech",
        ind_writer: "writer-ind",
        inc_writer: "writer-ind",
      }),
    );

    expect(created.id).toBe("proj-1");
  });

  it("rolls back project when user_project insert fails", async () => {
    const assignmentError = { message: "insert failed" };
    const rollbackEq = jest.fn().mockResolvedValue({ error: null });
    const projectsDelete = jest.fn().mockReturnValue({ eq: rollbackEq });

    const supabaseMock = {
      from: jest.fn((table: string) => {
        if (table === "users") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { tenantid: "tenant-1" },
                  error: null,
                }),
              }),
            }),
          };
        }

        if (table === "projects") {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: baseProjectRow,
                  error: null,
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({ eq: jest.fn() }),
            delete: projectsDelete,
          };
        }

        if (table === "user_project") {
          return {
            insert: jest.fn().mockResolvedValue({ error: assignmentError }),
          };
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    };

    mockedCreateBrowserClient.mockReturnValue(
      supabaseMock as unknown as ReturnType<typeof createBrowserClient>,
    );

    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ ok: true }),
    });

    const projectData: ProjectCreation = {
      ind_title: "Lpathomab IND",
      drug_name: "LT3114",
      product_type: "mab",
      sponsor_contact_email: "sponsor@example.com",
    };

    await expect(
      createProjectRowWithOwnerAssignment({ projectData, userId: "user-1" }),
    ).rejects.toEqual(assignmentError);

    expect(projectsDelete).toHaveBeenCalled();
    expect(rollbackEq).toHaveBeenCalledWith("id", "proj-1");
  });

  it("fetches visible rows for non-admin user from user_project assignments", async () => {
    const projectRows = [{ ...baseProjectRow, id: "proj-visible" }];

    const supabaseMock = {
      from: jest.fn((table: string) => {
        if (table === "users") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { tenantid: "tenant-1", email: "user@example.com" },
                  error: null,
                }),
              }),
            }),
          };
        }

        if (table === "user_project") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [{ project_id: "proj-visible", role: "viewer" }],
                error: null,
              }),
            }),
          };
        }

        if (table === "projects") {
          return {
            select: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                in: jest.fn().mockResolvedValue({
                  data: projectRows,
                  error: null,
                }),
              }),
            }),
          };
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    };

    mockedCreateClient.mockReturnValue(
      supabaseMock as unknown as ReturnType<typeof createClient>,
    );

    const result = await fetchVisibleProjectRowsForUser({
      userId: "user-1",
      requireAssignmentsForNonAdmin: true,
    });

    expect(result.rows).toEqual(projectRows);
    expect(result.assignmentRows).toEqual([
      { project_id: "proj-visible", role: "viewer" },
    ]);
    expect(result.fallbackTenantId).toBe("tenant-1");
    expect(mockedIsAdminEmail).toHaveBeenCalledWith("user@example.com");
  });

  it("returns current authenticated user id", async () => {
    mockedCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
    } as unknown as ReturnType<typeof createClient>);

    await expect(getCurrentAuthenticatedUserId()).resolves.toBe("user-123");
  });
});
