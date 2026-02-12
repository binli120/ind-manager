// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import type { Database } from "@/lib/supabase/schema";
import type { ProjectCreation } from "@/lib/projects/types";
import { isAdminEmail } from "@/lib/utils";
import {
  createProjectFolderStructure,
  deleteProjectRow,
  fetchCurrentAuthenticatedUserId as fetchCurrentAuthenticatedUserIdFromRepository,
  fetchProjectRows,
  fetchUserProjectAssignments,
  fetchUserTenantAndEmail,
  fetchUserTenantId,
  insertProjectRow,
  insertUserProjectAssignment,
} from "@/lib/projects/projects.repository";
import {
  createProjectRowWithOwnerAssignment,
  fetchVisibleProjectRowsForUser,
  getCurrentAuthenticatedUserId,
} from "../projectService";

jest.mock("@/lib/projects/projects.repository", () => ({
  createProjectFolderStructure: jest.fn(),
  deleteProjectRow: jest.fn(),
  fetchCurrentAuthenticatedUserId: jest.fn(),
  fetchProjectRows: jest.fn(),
  fetchUserProjectAssignments: jest.fn(),
  fetchUserTenantAndEmail: jest.fn(),
  fetchUserTenantId: jest.fn(),
  insertProjectRow: jest.fn(),
  insertUserProjectAssignment: jest.fn(),
  updateProjectRow: jest.fn(),
  fetchProjectById: jest.fn(),
}));

jest.mock("@/lib/utils", () => ({
  isAdminEmail: jest.fn(),
}));

const mockedIsAdminEmail = isAdminEmail as jest.MockedFunction<typeof isAdminEmail>;
const mockedCreateProjectFolderStructure =
  createProjectFolderStructure as jest.MockedFunction<
    typeof createProjectFolderStructure
  >;
const mockedDeleteProjectRow = deleteProjectRow as jest.MockedFunction<
  typeof deleteProjectRow
>;
const mockedFetchCurrentAuthenticatedUserIdFromRepository =
  fetchCurrentAuthenticatedUserIdFromRepository as jest.MockedFunction<
    typeof fetchCurrentAuthenticatedUserIdFromRepository
  >;
const mockedFetchProjectRows = fetchProjectRows as jest.MockedFunction<
  typeof fetchProjectRows
>;
const mockedFetchUserProjectAssignments =
  fetchUserProjectAssignments as jest.MockedFunction<
    typeof fetchUserProjectAssignments
  >;
const mockedFetchUserTenantAndEmail =
  fetchUserTenantAndEmail as jest.MockedFunction<typeof fetchUserTenantAndEmail>;
const mockedFetchUserTenantId = fetchUserTenantId as jest.MockedFunction<
  typeof fetchUserTenantId
>;
const mockedInsertProjectRow = insertProjectRow as jest.MockedFunction<
  typeof insertProjectRow
>;
const mockedInsertUserProjectAssignment =
  insertUserProjectAssignment as jest.MockedFunction<
    typeof insertUserProjectAssignment
  >;

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
  beforeEach(() => {
    jest.clearAllMocks();
    mockedIsAdminEmail.mockReturnValue(false);
  });

  it("creates folder + project + owner assignment", async () => {
    mockedFetchUserTenantId.mockResolvedValue("tenant-1");
    mockedCreateProjectFolderStructure.mockResolvedValue(undefined);
    mockedInsertProjectRow.mockResolvedValue(baseProjectRow);
    mockedInsertUserProjectAssignment.mockResolvedValue(undefined);

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

    expect(mockedCreateProjectFolderStructure).toHaveBeenCalledWith({
      tenantName: "filynai.com",
      projectName: "Lpathomab IND",
    });

    expect(mockedInsertProjectRow).toHaveBeenCalledWith(
      expect.objectContaining({
        project_creator_id: "user-1",
        tenantid: "tenant-1",
        fda_contact_email: null,
      }),
    );

    expect(mockedInsertUserProjectAssignment).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: "proj-1",
        user_id: "user-1",
        role: "admin",
      }),
    );

    expect(created.id).toBe("proj-1");
  });

  it("rolls back project when user_project insert fails", async () => {
    const assignmentError = new Error("insert failed");

    mockedFetchUserTenantId.mockResolvedValue("tenant-1");
    mockedCreateProjectFolderStructure.mockResolvedValue(undefined);
    mockedInsertProjectRow.mockResolvedValue(baseProjectRow);
    mockedInsertUserProjectAssignment.mockRejectedValue(assignmentError);
    mockedDeleteProjectRow.mockResolvedValue(undefined);

    const projectData: ProjectCreation = {
      ind_title: "Lpathomab IND",
      drug_name: "LT3114",
      product_type: "mab",
      sponsor_contact_email: "sponsor@example.com",
    };

    await expect(
      createProjectRowWithOwnerAssignment({ projectData, userId: "user-1" }),
    ).rejects.toBe(assignmentError);

    expect(mockedDeleteProjectRow).toHaveBeenCalledWith("proj-1");
  });

  it("fetches visible rows for non-admin user from user_project assignments", async () => {
    const projectRows = [{ ...baseProjectRow, id: "proj-visible" }];

    mockedFetchUserTenantAndEmail.mockResolvedValue({
      tenantid: "tenant-1",
      email: "user@example.com",
    });
    mockedFetchUserProjectAssignments.mockResolvedValue([
      { project_id: "proj-visible", role: "viewer" },
    ]);
    mockedFetchProjectRows.mockResolvedValue(projectRows);

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
    expect(mockedFetchProjectRows).toHaveBeenCalledWith({
      projectIds: ["proj-visible"],
    });
  });

  it("returns current authenticated user id", async () => {
    mockedFetchCurrentAuthenticatedUserIdFromRepository.mockResolvedValue(
      "user-123",
    );

    await expect(getCurrentAuthenticatedUserId()).resolves.toBe("user-123");
  });
});
