import {
  projectsReducer,
  setSelectedProjectId,
  setViewMode,
  clearFilters,
  type Project,
} from "../slices"

const baseProject: Project = {
  id: "p1",
  title: "Test",
  code: "IND-001",
  description: "",
  status: "draft",
  priority: "low",
  progress: 0,
  sponsor: "",
  drug: "",
  targetDate: "",
  teamId: "t1",
  ownerId: "u1",
  teamSize: 0,
  teamMembers: [],
  createdAt: "",
  updatedAt: "",
  settings: { isPublic: false, allowCollaboration: true },
  metadata: {},
  targetIndSubmissionDate: "",
  preIndMeetingDate: null,
  projectStartDate: "",
  fdaContactEmail: null,
  sponsorContactEmail: "",
  additionalNotes: null,
  productType: "",
}

describe("projectsSlice reducers", () => {
  it("selects project and updates view mode", () => {
    const populated = projectsReducer(
      { projects: [baseProject], currentProject: null, selectedProjectId: null, isLoading: false, hasLoadedOnce: false, error: null, filters: { search: "", status: "all", priority: "all" }, viewMode: "grid" },
      setSelectedProjectId("p1"),
    )
    expect(populated.selectedProjectId).toBe("p1")

    const updatedView = projectsReducer(populated, setViewMode("list"))
    expect(updatedView.viewMode).toBe("list")
  })

  it("clears filters", () => {
    const state = projectsReducer(undefined, clearFilters())
    expect(state.filters).toEqual({ search: "", status: "all", priority: "all" })
  })
})
