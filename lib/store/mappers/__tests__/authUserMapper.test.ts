import { mapSupabaseUserToAuthUser } from "../authUserMapper";

describe("authUserMapper", () => {
  it("maps profile role over metadata role", () => {
    const user = mapSupabaseUserToAuthUser({
      authUser: {
        id: "u1",
        email: "a@b.com",
        created_at: "2026-01-01",
        last_sign_in_at: "2026-01-02",
        user_metadata: { name: "Alice", privilege: "admin", role: "viewer" },
      } as never,
      profile: {
        name: "Alice Profile",
        avatar_url: "https://avatar",
        submission_role: "project_manager",
      },
    });

    expect(user).toEqual({
      id: "u1",
      email: "a@b.com",
      name: "Alice Profile",
      avatar: "https://avatar",
      privilege: "admin",
      role: "project_manager",
      createdAt: "2026-01-01",
      lastLoginAt: "2026-01-02",
    });
  });

  it("falls back to metadata/defaults", () => {
    const user = mapSupabaseUserToAuthUser({
      authUser: {
        id: "u2",
        email: "c@d.com",
        created_at: "2026-01-01",
        user_metadata: { name: "Bob" },
      } as never,
      profile: null,
    });

    expect(user.privilege).toBe("user");
    expect(user.role).toBeNull();
    expect(user.name).toBe("Bob");
  });
});
