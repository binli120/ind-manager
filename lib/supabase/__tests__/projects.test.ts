import {
  createProject,
  deleteProject,
  fetchProjects,
  updateProject,
} from "../projects";
import {
  createProjectRowWithOwnerAssignment,
  deleteProjectById,
  fetchVisibleProjectRowsForUser,
  getCurrentAuthenticatedUserId,
  updateProjectRowById,
} from "@/lib/projects/projectService";
import { dbToClientProject, mapProjectRowsToProjects } from "@/lib/projects/projectMapper";

jest.mock("@/lib/projects/projectService", () => ({
  createProjectRowWithOwnerAssignment: jest.fn(),
  deleteProjectById: jest.fn(),
  fetchVisibleProjectRowsForUser: jest.fn(),
  getCurrentAuthenticatedUserId: jest.fn(),
  updateProjectRowById: jest.fn(),
}));

jest.mock("@/lib/projects/projectMapper", () => ({
  dbToClientProject: jest.fn(),
  mapProjectRowsToProjects: jest.fn(),
}));

const mockedCreateProjectRowWithOwnerAssignment =
  createProjectRowWithOwnerAssignment as jest.MockedFunction<
    typeof createProjectRowWithOwnerAssignment
  >;
const mockedDeleteProjectById = deleteProjectById as jest.MockedFunction<
  typeof deleteProjectById
>;
const mockedFetchVisibleProjectRowsForUser =
  fetchVisibleProjectRowsForUser as jest.MockedFunction<
    typeof fetchVisibleProjectRowsForUser
  >;
const mockedGetCurrentAuthenticatedUserId =
  getCurrentAuthenticatedUserId as jest.MockedFunction<
    typeof getCurrentAuthenticatedUserId
  >;
const mockedUpdateProjectRowById = updateProjectRowById as jest.MockedFunction<
  typeof updateProjectRowById
>;
const mockedDbToClientProject = dbToClientProject as jest.MockedFunction<
  typeof dbToClientProject
>;
const mockedMapProjectRowsToProjects = mapProjectRowsToProjects as jest.MockedFunction<
  typeof mapProjectRowsToProjects
>;

describe("lib/supabase/projects", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches visible projects with resolved auth user id", async () => {
    mockedGetCurrentAuthenticatedUserId.mockResolvedValue("user-1");
    mockedFetchVisibleProjectRowsForUser.mockResolvedValue({
      rows: [
        { id: "p1", tenantid: "t1" },
        { id: "p2", tenantid: "t2" },
      ] as never,
      assignmentRows: [{ project_id: "p1", role: "viewer" }],
      fallbackTenantId: "t1",
    });
    mockedMapProjectRowsToProjects.mockReturnValue([
      { id: "p1" },
      { id: "p2" },
    ] as never);

    const data = await fetchProjects();

    expect(mockedFetchVisibleProjectRowsForUser).toHaveBeenCalledWith({
      userId: "user-1",
      requireAssignmentsForNonAdmin: false,
    });
    expect(mockedMapProjectRowsToProjects).toHaveBeenCalled();
    expect(data).toHaveLength(2);
  });

  it("filters projects by tenant id", async () => {
    mockedFetchVisibleProjectRowsForUser.mockResolvedValue({
      rows: [
        { id: "p1", tenantid: "t1" },
        { id: "p2", tenantid: "t2" },
      ] as never,
      assignmentRows: [],
      fallbackTenantId: "t1",
    });
    mockedMapProjectRowsToProjects.mockReturnValue([{ id: "p1" }] as never);

    await fetchProjects("t1", "user-1");

    expect(mockedMapProjectRowsToProjects).toHaveBeenCalledWith(
      expect.objectContaining({
        rows: [{ id: "p1", tenantid: "t1" }],
      }),
    );
  });

  it("delegates create/update/delete to project services", async () => {
    mockedCreateProjectRowWithOwnerAssignment.mockResolvedValue({ id: "p1" } as never);
    mockedUpdateProjectRowById.mockResolvedValue({ id: "p1" } as never);
    mockedDbToClientProject.mockReturnValue({ id: "p1" } as never);

    await createProject(
      {
        ind_title: "My IND",
        drug_name: "Drug",
        product_type: "mab",
        sponsor_contact_email: "sponsor@example.com",
      },
      "tenant-1",
      "user-1",
    );
    await updateProject("p1", { description: "updated" });
    await deleteProject("p1");

    expect(mockedCreateProjectRowWithOwnerAssignment).toHaveBeenCalled();
    expect(mockedUpdateProjectRowById).toHaveBeenCalledWith({
      projectId: "p1",
      updates: { description: "updated" },
    });
    expect(mockedDeleteProjectById).toHaveBeenCalledWith("p1");
  });
});
