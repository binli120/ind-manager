// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import {
  addUserToProject,
  createUser,
  fetchCurrentUser,
  fetchUserProjectIds,
  fetchUsers,
  removeUserFromProject,
  updateUser,
  updateUserStatus,
} from "../users";
import {
  deleteUserProjectAssignment,
  fetchAssignedProjectIds,
  fetchUserRowById,
  fetchUserRows,
  insertUserProjectAssignment,
  insertUserRow,
  updateUserRow,
  updateUserStatusRow,
} from "@/lib/users/users.repository";

jest.mock("@/lib/users/users.repository", () => ({
  deleteUserProjectAssignment: jest.fn(),
  fetchAssignedProjectIds: jest.fn(),
  fetchUserRowById: jest.fn(),
  fetchUserRows: jest.fn(),
  insertUserProjectAssignment: jest.fn(),
  insertUserRow: jest.fn(),
  updateUserRow: jest.fn(),
  updateUserStatusRow: jest.fn(),
}));

const mockedDeleteUserProjectAssignment =
  deleteUserProjectAssignment as jest.MockedFunction<
    typeof deleteUserProjectAssignment
  >;
const mockedFetchAssignedProjectIds =
  fetchAssignedProjectIds as jest.MockedFunction<typeof fetchAssignedProjectIds>;
const mockedFetchUserRowById = fetchUserRowById as jest.MockedFunction<
  typeof fetchUserRowById
>;
const mockedFetchUserRows = fetchUserRows as jest.MockedFunction<
  typeof fetchUserRows
>;
const mockedInsertUserProjectAssignment =
  insertUserProjectAssignment as jest.MockedFunction<
    typeof insertUserProjectAssignment
  >;
const mockedInsertUserRow = insertUserRow as jest.MockedFunction<
  typeof insertUserRow
>;
const mockedUpdateUserRow = updateUserRow as jest.MockedFunction<
  typeof updateUserRow
>;
const mockedUpdateUserStatusRow = updateUserStatusRow as jest.MockedFunction<
  typeof updateUserStatusRow
>;

describe("lib/supabase/users", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("maps fetchUsers response", async () => {
    mockedFetchUserRows.mockResolvedValue([
      {
        id: "u1",
        name: "Alice",
        email: "alice@example.com",
        phone: "123",
        submission_role: "project_manager",
        status: "active",
        tenantid: "t1",
        tenants: { name: "Acme" },
      },
    ]);

    const users = await fetchUsers();

    expect(users[0]).toEqual({
      id: "u1",
      name: "Alice",
      email: "alice@example.com",
      phone: "123",
      role: "project_manager",
      company: "Acme",
      status: "active",
    });
  });

  it("maps updateUserStatus response", async () => {
    mockedUpdateUserStatusRow.mockResolvedValue({
      id: "u1",
      name: "Alice",
      email: "alice@example.com",
      phone: "123",
      submission_role: "project_manager",
      status: "inactive",
      tenantid: "t1",
      tenants: { name: "Acme" },
    });

    const user = await updateUserStatus("u1", "inactive");
    expect(user.status).toBe("inactive");
    expect(user.company).toBe("Acme");
  });

  it("maps createUser response", async () => {
    mockedInsertUserRow.mockResolvedValue({
      id: "u1",
      name: "Alice",
      email: "alice@example.com",
      phone: "123",
      submission_role: "project_manager",
      status: "pending",
      tenantid: "t1",
      tenants: { name: "Acme" },
    });

    const user = await createUser({
      id: "u1",
      name: "Alice",
      email: "alice@example.com",
      phone: "123",
      role: "project_manager",
      tenantId: "t1",
    });

    expect(user.company).toBe("Acme");
    expect(user.status).toBe("pending");
  });

  it("creates system admin user without tenant", async () => {
    mockedInsertUserRow.mockResolvedValue({
      id: "u2",
      name: "Global Admin",
      email: "admin@example.com",
      phone: "123",
      submission_role: "project_manager",
      status: "pending",
      tenantid: null,
      tenants: null,
    });

    const user = await createUser({
      id: "u2",
      name: "Global Admin",
      email: "admin@example.com",
      phone: "123",
      role: "project_manager",
    });

    expect(mockedInsertUserRow).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "u2",
        name: "Global Admin",
      }),
    );
    expect(user.company).toBe("");
  });

  it("maps updateUser response", async () => {
    mockedUpdateUserRow.mockResolvedValue({
      id: "u1",
      name: "Alice Updated",
      email: "alice.updated@example.com",
      phone: "999",
      submission_role: "project_manager",
      status: "active",
      tenantid: "t1",
      tenants: { name: "Acme" },
    });

    const user = await updateUser({
      id: "u1",
      name: "Alice Updated",
      email: "alice.updated@example.com",
      phone: "999",
      role: "project_manager",
      tenantId: "t1",
    });

    expect(user.name).toBe("Alice Updated");
    expect(user.email).toBe("alice.updated@example.com");
    expect(user.company).toBe("Acme");
  });

  it("returns current user", async () => {
    mockedFetchUserRowById.mockResolvedValue({
      id: "u1",
      name: "Alice",
      email: "alice@example.com",
      phone: "123",
      submission_role: "project_manager",
      status: "active",
      tenantid: "t1",
      tenants: { name: "Acme" },
    });

    const user = await fetchCurrentUser("u1");
    expect(user?.id).toBe("u1");
    expect(user?.role).toBe("project_manager");
  });

  it("returns project ids from user_project", async () => {
    mockedFetchAssignedProjectIds.mockResolvedValue(["p1", "p2"]);

    await expect(fetchUserProjectIds("u1")).resolves.toEqual(["p1", "p2"]);
  });

  it("adds and removes user-project assignments", async () => {
    mockedInsertUserProjectAssignment.mockResolvedValue(undefined);
    mockedDeleteUserProjectAssignment.mockResolvedValue(undefined);

    await expect(addUserToProject("u1", "p1", "admin-1")).resolves.toBeUndefined();
    await expect(removeUserFromProject("u1", "p1")).resolves.toBeUndefined();

    expect(mockedInsertUserProjectAssignment).toHaveBeenCalledWith({
      userId: "u1",
      projectId: "p1",
      currentUserId: "admin-1",
    });
    expect(mockedDeleteUserProjectAssignment).toHaveBeenCalledWith({
      userId: "u1",
      projectId: "p1",
    });
  });
});
