import { upsertSectionPath } from "@/lib/section-tree"
import type { Section } from "@/types/section"

describe("upsertSectionPath", () => {
  it("creates a new root and nested subsections when tree is empty", () => {
    const { sections, leaf, section } = upsertSectionPath([], "2.4.1.1")

    expect(sections).toHaveLength(1)
    expect(section.number).toBe("2")
    const level1 = section.subsections?.find((s) => s.subsectionNumber === "2.4")
    expect(level1).toBeDefined()
    const level2 = level1?.subsections?.find((s) => s.subsectionNumber === "2.4.1")
    expect(level2).toBeDefined()
    const level3 = level2?.subsections?.find((s) => s.subsectionNumber === "2.4.1.1")
    expect(level3).toBeDefined()
    expect(leaf.subsectionNumber).toBe("2.4.1.1")
    expect(leaf.isUserAdded).toBe(true)
  })

  it("reuses existing nodes and only adds the missing leaf", () => {
    const baseTree: Section[] = [
      {
        id: "section-2",
        number: "2",
        title: "Module 2",
        parentSection: "",
        isRequired: true,
        status: "draft",
        isCategory: true,
        subsections: [
          {
            id: "sub-2.4",
            subsectionNumber: "2.4",
            title: "Nonclinical Overview",
            header: "",
            content: "",
            isRequired: true,
            status: "draft",
            isCategory: true,
            subsections: [
              {
                id: "sub-2.4.1",
                subsectionNumber: "2.4.1",
                title: "Overview",
                header: "",
                content: "",
                isRequired: true,
                status: "draft",
                isCategory: true,
                subsections: [],
              },
            ],
          },
        ],
      },
    ]

    const { sections, leaf } = upsertSectionPath(baseTree, "2.4.1.2")
    const updatedSection = sections[0]
    const level1 = updatedSection.subsections?.find((s) => s.subsectionNumber === "2.4")
    const level2 = level1?.subsections?.find((s) => s.subsectionNumber === "2.4.1")
    expect(level2?.subsections?.some((s) => s.subsectionNumber === "2.4.1.2")).toBe(true)
    expect(level2?.subsections?.length).toBe(1)
    expect(leaf.subsectionNumber).toBe("2.4.1.2")
  })
})
