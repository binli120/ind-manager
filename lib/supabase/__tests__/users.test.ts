import {
  addUserToProject,
  createUser,
  fetchCurrentUser,
  fetchUserProjectIds,
  fetchUsers,
  removeUserFromProject,
  updateUserStatus,
} from "../users";
import { createClient } from "@/lib/supabase/client";

jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(),
}));

const mockedCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe("lib/supabase/users", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("maps fetchUsers response", async () => {
    const select = jest.fn().mockReturnValue({
      order: jest.fn().mockResolvedValue({
        data: [
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
        ],
        error: null,
      }),
    });

    mockedCreateClient.mockReturnValue({
      from: jest.fn().mockReturnValue({ select }),
    } as unknown as ReturnType<typeof createClient>);

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
    const single = jest.fn().mockResolvedValue({
      data: {
        id: "u1",
        name: "Alice",
        email: "alice@example.com",
        phone: "123",
        submission_role: "project_manager",
        status: "inactive",
        tenantid: "t1",
        tenants: { name: "Acme" },
      },
      error: null,
    });

    mockedCreateClient.mockReturnValue({
      from: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({ single }),
          }),
        }),
      }),
    } as unknown as ReturnType<typeof createClient>);

    const user = await updateUserStatus("u1", "inactive");
    expect(user.status).toBe("inactive");
    expect(user.company).toBe("Acme");
  });

  it("maps createUser response", async () => {
    const single = jest.fn().mockResolvedValue({
      data: {
        id: "u1",
        name: "Alice",
        email: "alice@example.com",
        phone: "123",
        submission_role: "project_manager",
        status: "pending",
        tenantid: "t1",
        tenants: { name: "Acme" },
      },
      error: null,
    });

    mockedCreateClient.mockReturnValue({
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({ single }),
        }),
      }),
    } as unknown as ReturnType<typeof createClient>);

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

  it("returns current user", async () => {
    const maybeSingle = jest.fn().mockResolvedValue({
      data: {
        id: "u1",
        name: "Alice",
        email: "alice@example.com",
        phone: "123",
        submission_role: "project_manager",
        status: "active",
        tenantid: "t1",
        tenants: { name: "Acme" },
      },
      error: null,
    });

    mockedCreateClient.mockReturnValue({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({ maybeSingle }),
        }),
      }),
    } as unknown as ReturnType<typeof createClient>);

    const user = await fetchCurrentUser("u1");
    expect(user?.id).toBe("u1");
    expect(user?.role).toBe("project_manager");
  });

  it("returns project ids from user_project", async () => {
    mockedCreateClient.mockReturnValue({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [{ project_id: "p1" }, { project_id: "p2" }],
            error: null,
          }),
        }),
      }),
    } as unknown as ReturnType<typeof createClient>);

    await expect(fetchUserProjectIds("u1")).resolves.toEqual(["p1", "p2"]);
  });

  it("adds and removes user-project assignments", async () => {
    const removeEqSecond = jest.fn().mockResolvedValue({ error: null });
    const removeEqFirst = jest.fn().mockReturnValue({ eq: removeEqSecond });

    mockedCreateClient.mockReturnValue({
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null }),
        delete: jest.fn().mockReturnValue({
          eq: removeEqFirst,
        }),
      }),
    } as unknown as ReturnType<typeof createClient>);

    await expect(addUserToProject("u1", "p1", "admin-1")).resolves.toBeUndefined();
    await expect(removeUserFromProject("u1", "p1")).resolves.toBeUndefined();

    expect(removeEqFirst).toHaveBeenCalledWith("user_id", "u1");
    expect(removeEqSecond).toHaveBeenCalledWith("project_id", "p1");
  });
});
