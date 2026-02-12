import {
  mapSupabaseCommentRowToDocumentComment,
  mapSupabaseDocumentRowToDocument,
  mapSupabaseDocumentRowsToDocuments,
} from "../documentMapper";

describe("documentMapper", () => {
  it("maps document row to document", () => {
    const mapped = mapSupabaseDocumentRowToDocument({
      id: "d1",
      title: "Doc",
      project_id: "p1",
      team_id: "t1",
      owner_id: "u1",
      status: "draft",
      type: "ind",
      updated_at: "2026-01-01",
      profiles: { name: "Alice" },
    });

    expect(mapped.ownerName).toBe("Alice");
    expect(mapped.permissions.canEdit).toBe(true);
    expect(mapped.sections).toEqual([]);
  });

  it("maps list of documents", () => {
    const mapped = mapSupabaseDocumentRowsToDocuments([
      {
        id: "d1",
        title: "Doc",
        project_id: "p1",
        team_id: "t1",
        owner_id: "u1",
        status: "draft",
        type: "ind",
        updated_at: "2026-01-01",
      },
    ]);

    expect(mapped).toHaveLength(1);
  });

  it("maps comment row", () => {
    const mapped = mapSupabaseCommentRowToDocumentComment({
      id: "c1",
      user_id: "u1",
      content: "hello",
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
      profiles: { name: "Alice" },
      is_resolved: false,
    });

    expect(mapped.userName).toBe("Alice");
    expect(mapped.isResolved).toBe(false);
  });
});
