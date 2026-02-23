// Author: Bin Lee
// Email: binlee120@gmail.com

import {
  buildTreeCacheKey,
  deriveSmartEditorContext,
  fetchSectionTree,
  fetchSignedProjectAsset,
  markdownToHtml,
  toSectionNumber,
} from "../smartEditorViewModel";

describe("lib/smart-editor/smartEditorViewModel", () => {
  const fetchMock = jest.fn();

  beforeAll(() => {
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("derives context using metadata when available", () => {
    const context = deriveSmartEditorContext({
      currentProject: {
        id: "project-1",
        title: "Fallback Title",
        metadata: {
          company: "Tenant Co",
          ind_title: "IND Program",
          primaryDocumentS3Key: "tenant/project/file.pdf",
        },
      },
      tenants: [{ id: "tenant-1", name: "Tenant Name" }],
      selectedTenantId: "tenant-1",
    });

    expect(context.companyValue).toBe("Tenant Co");
    expect(context.projectNameValue).toBe("IND Program");
    expect(context.primaryS3Key).toBe("tenant/project/file.pdf");
  });

  it("falls back to tenant and project fields", () => {
    const context = deriveSmartEditorContext({
      currentProject: {
        id: "project-2",
        code: "IND-2",
      },
      tenants: [{ id: "tenant-2", name: "Acme" }],
      selectedTenantId: "tenant-2",
    });

    expect(context.companyValue).toBe("Acme");
    expect(context.projectNameValue).toBe("IND-2");
    expect(context.primaryS3Key).toBeUndefined();
  });

  it("converts markdown to escaped paragraph html", () => {
    expect(markdownToHtml("Hello\nWorld\n\n<script>alert('x')</script>")).toBe(
      "<p>Hello<br />World</p><p>&lt;script&gt;alert(&#039;x&#039;)&lt;/script&gt;</p>",
    );
  });

  it("extracts section number prefix", () => {
    expect(toSectionNumber("4.2.1 Pharmacology")).toBe("4.2.1");
    expect(toSectionNumber("Section 4")).toBeNull();
  });

  it("builds deterministic cache key", () => {
    expect(
      buildTreeCacheKey("project-1", "s3/key", "Acme", "Program"),
    ).toBe("sectionTree:project-1:s3/key:Acme:Program");
  });

  it("validates section tree payload from API", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        sections: [
          {
            id: "s1",
            number: "2",
            title: "Section 2",
            parentSection: "",
            isRequired: false,
            status: "draft",
          },
        ],
      }),
    });

    const sections = await fetchSectionTree({
      projectId: "p1",
      company: "Acme",
      projectName: "Program",
    });

    expect(sections).toHaveLength(1);
    expect(sections[0].id).toBe("s1");
  });

  it("throws when section tree payload is invalid", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ sections: [{ id: 1 }] }),
    });

    await expect(
      fetchSectionTree({
        projectId: "p1",
        company: "Acme",
        projectName: "Program",
      }),
    ).rejects.toThrow();
  });

  it("validates signed asset payload by format", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ url: "https://example.com/file.pdf" }),
    });

    const urlPayload = await fetchSignedProjectAsset<{ url: string }>({
      projectId: "p1",
      key: "file.pdf",
      format: "url",
    });
    expect(urlPayload.url).toBe("https://example.com/file.pdf");
  });
});
