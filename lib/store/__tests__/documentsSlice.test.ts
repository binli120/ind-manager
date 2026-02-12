// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import {
  documentsReducer,
  setCurrentDocument,
  updateSectionLocally,
  type Document,
  type DocumentSection,
} from "../slices"

const baseSection: DocumentSection = {
  id: "s1",
  documentId: "d1",
  title: "Intro",
  content: "old",
  order: 1,
  isLocked: false,
  version: 1,
  createdAt: "",
  updatedAt: "",
}

const baseDocument: Document = {
  id: "d1",
  title: "Doc",
  description: "",
  projectId: "p1",
  teamId: "t1",
  ownerId: "u1",
  ownerName: "Owner",
  status: "draft",
  type: "ind",
  lastModified: "",
  activeUsers: 0,
  version: 1,
  isTemplate: false,
  sections: [baseSection],
  comments: [],
  versions: [],
  permissions: { canEdit: true, canComment: true, canView: true },
  metadata: {},
}

describe("documentsSlice reducers", () => {
  it("sets current document and selection", () => {
    const state = documentsReducer(undefined, setCurrentDocument(baseDocument))
    expect(state.currentDocument?.id).toBe("d1")
    expect(state.selectedDocumentId).toBe("d1")
  })

  it("updates section content locally and keeps selection", () => {
    const initialized = {
      ...documentsReducer(undefined, { type: "@@INIT" } as { type: string }),
      currentDocument: baseDocument,
      selectedDocumentId: "d1",
    }

    const updated = documentsReducer(initialized, updateSectionLocally({ sectionId: "s1", content: "new content" }))

    expect(updated.currentDocument?.sections[0].content).toBe("new content")
    expect(updated.selectedDocumentId).toBe("d1")
  })
})
