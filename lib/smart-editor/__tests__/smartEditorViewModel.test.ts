// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import {
  buildTreeCacheKey,
  deriveSmartEditorContext,
  markdownToHtml,
  toSectionNumber,
} from "../smartEditorViewModel";

describe("lib/smart-editor/smartEditorViewModel", () => {
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
});
