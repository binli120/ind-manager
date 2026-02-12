// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import type { Section } from "@/types/section";
import {
  addSubsectionForSelection,
  buildUploadedSection,
  deleteSubsectionFromSection,
  findParentSectionForSubsection,
  reorderSubsectionsInSection,
  toRelativeS3Key,
} from "../sectionTreeModel";

const sectionsFixture: Section[] = [
  {
    id: "section-1",
    number: "2",
    title: "Section 2",
    parentSection: "",
    isRequired: true,
    status: "draft",
    subsections: [
      {
        id: "cat-1",
        subsectionNumber: "2.1",
        title: "Category",
        header: "Category",
        content: "",
        isRequired: false,
        status: "draft",
        isCategory: true,
        subsections: [
          {
            id: "leaf-1",
            subsectionNumber: "2.1.1",
            title: "Leaf 1",
            header: "Leaf 1",
            content: "",
            isRequired: false,
            status: "draft",
          },
        ],
      },
      {
        id: "top-leaf",
        subsectionNumber: "2.2",
        title: "Top Leaf",
        header: "Top Leaf",
        content: "",
        isRequired: false,
        status: "draft",
      },
    ],
  },
  {
    id: "section-2",
    number: "3",
    title: "Section 3",
    parentSection: "",
    isRequired: false,
    status: "draft",
    subsections: [],
  },
];

describe("lib/smart-editor/sectionTreeModel", () => {
  it("finds parent section for a nested subsection", () => {
    const section = findParentSectionForSubsection({
      sections: sectionsFixture,
      subsectionId: "leaf-1",
    });

    expect(section?.id).toBe("section-1");
  });

  it("adds subsection at top level when no subsection is selected", () => {
    const result = addSubsectionForSelection({
      sections: sectionsFixture,
      selectedSectionId: "section-1",
      selectedSubsection: null,
      subsectionNumber: "2.3",
      header: "New Top",
      now: 100,
    });

    const target = result.sections[0].subsections ?? [];
    expect(target[target.length - 1].id).toBe("new-100");
    expect(result.nextSelectedSubsection).toBeNull();
  });

  it("adds subsection under selected category and returns updated category", () => {
    const result = addSubsectionForSelection({
      sections: sectionsFixture,
      selectedSectionId: "section-1",
      selectedSubsection: {
        id: "cat-1",
        subsectionNumber: "2.1",
        title: "Category",
        header: "Category",
        content: "",
        isRequired: false,
        status: "draft",
        isCategory: true,
      },
      subsectionNumber: "2.1.2",
      header: "New Child",
      now: 101,
    });

    expect(result.nextSelectedSubsection?.id).toBe("cat-1");
    const updatedCategory = (result.sections[0].subsections ?? [])[0];
    expect(updatedCategory.subsections?.map((sub) => sub.id)).toContain("new-101");
  });

  it("adds sibling beside selected subsection and returns updated parent", () => {
    const result = addSubsectionForSelection({
      sections: sectionsFixture,
      selectedSectionId: "section-1",
      selectedSubsection: {
        id: "leaf-1",
        subsectionNumber: "2.1.1",
        title: "Leaf 1",
        header: "Leaf 1",
        content: "",
        isRequired: false,
        status: "draft",
      },
      subsectionNumber: "2.1.2",
      header: "Sibling",
      now: 102,
    });

    expect(result.nextSelectedSubsection?.id).toBe("cat-1");
    const category = (result.sections[0].subsections ?? [])[0];
    expect(category.subsections?.map((sub) => sub.id)).toEqual([
      "leaf-1",
      "new-102",
    ]);
  });

  it("deletes subsection recursively within selected section", () => {
    const result = deleteSubsectionFromSection({
      sections: sectionsFixture,
      selectedSectionId: "section-1",
      subsectionId: "leaf-1",
    });

    const category = (result[0].subsections ?? [])[0];
    expect(category.subsections).toEqual([]);
  });

  it("reorders subsection positions within selected section", () => {
    const result = reorderSubsectionsInSection({
      sections: sectionsFixture,
      selectedSectionId: "section-1",
      draggedId: "top-leaf",
      targetId: "cat-1",
    });

    expect((result[0].subsections ?? []).map((sub) => sub.id)).toEqual([
      "top-leaf",
      "cat-1",
    ]);
  });

  it("normalizes s3 key and builds uploaded section", () => {
    expect(toRelativeS3Key("s3://bucket/tenant/project/file.pdf")).toBe(
      "tenant/project/file.pdf",
    );

    const section = buildUploadedSection({
      sectionNumber: "4.2",
      fileName: "Example.pdf",
      now: 500,
    });

    expect(section.id).toBe("uploaded-500");
    expect(section.title).toBe("Example");
    expect(section.parentSection).toBe("4");
  });
});
