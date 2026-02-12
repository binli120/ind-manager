import { createClient } from "@/lib/supabase/client";
import {
  deleteUserProjectAssignment,
  fetchUserRows,
  insertUserProjectAssignment,
  updateUserRow,
} from "../users.repository";

jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(),
}));

const mockedCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe("lib/users/users.repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches tenant-scoped users", async () => {
    const eqMock = jest.fn().mockResolvedValue({
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
    });

    mockedCreateClient.mockReturnValue({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            eq: eqMock,
          }),
        }),
      }),
    } as unknown as ReturnType<typeof createClient>);

    const rows = await fetchUserRows("t1");
    expect(eqMock).toHaveBeenCalledWith("tenantid", "t1");
    expect(rows).toHaveLength(1);
  });

  it("inserts and removes assignment rows", async () => {
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

    await expect(
      insertUserProjectAssignment({
        userId: "u1",
        projectId: "p1",
        currentUserId: "admin-1",
      }),
    ).resolves.toBeUndefined();

    await expect(
      deleteUserProjectAssignment({ userId: "u1", projectId: "p1" }),
    ).resolves.toBeUndefined();

    expect(removeEqFirst).toHaveBeenCalledWith("user_id", "u1");
    expect(removeEqSecond).toHaveBeenCalledWith("project_id", "p1");
  });

  it("updates a user row", async () => {
    const singleMock = jest.fn().mockResolvedValue({
      data: {
        id: "u1",
        name: "Alice Updated",
        email: "alice.updated@example.com",
        phone: "999",
        submission_role: "project_manager",
        status: "active",
        tenantid: "t1",
        tenants: { name: "Acme" },
      },
      error: null,
    });
    const selectMock = jest.fn().mockReturnValue({ single: singleMock });
    const eqMock = jest.fn().mockReturnValue({ select: selectMock });

    mockedCreateClient.mockReturnValue({
      from: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: eqMock,
        }),
      }),
    } as unknown as ReturnType<typeof createClient>);

    const row = await updateUserRow({
      id: "u1",
      name: "Alice Updated",
      email: "alice.updated@example.com",
      phone: "999",
      role: "project_manager",
      tenantId: "t1",
    });

    expect(eqMock).toHaveBeenCalledWith("id", "u1");
    expect(row.name).toBe("Alice Updated");
    expect(row.email).toBe("alice.updated@example.com");
  });
});
