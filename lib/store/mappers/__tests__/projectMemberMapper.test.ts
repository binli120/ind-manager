import { mapProjectMemberPayloadToProjectMember } from "../projectMemberMapper";

describe("projectMemberMapper", () => {
  it("maps payload to project member", () => {
    const member = mapProjectMemberPayloadToProjectMember({
      id: "m1",
      user_id: "u1",
      project_id: "p1",
      profiles: { name: "Alice Doe", avatar_url: "https://avatar" },
      role: "lead",
      created_at: "2026-01-01",
    });

    expect(member).toEqual({
      id: "m1",
      userId: "u1",
      projectId: "p1",
      name: "Alice Doe",
      avatar: "https://avatar",
      initials: "AD",
      role: "lead",
      joinedAt: "2026-01-01",
    });
  });

  it("returns null when id is missing", () => {
    expect(mapProjectMemberPayloadToProjectMember({ user_id: "u1" })).toBeNull();
  });
});
