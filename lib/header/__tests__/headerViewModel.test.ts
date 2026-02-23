// Author: Bin Lee
// Email: binlee120@gmail.com

import type { Project } from "@/lib/projects/types";
import {
  getBreadcrumbText,
  getEffectiveProjects,
  getVisibleProjects,
  resolveProjectSelection,
  resolveTenantSelection,
} from "../headerViewModel";

const projects: Project[] = [
  {
    id: "p1",
    title: "Alpha",
    code: "IND-001",
    description: "",
    status: "draft",
    priority: "medium",
    progress: 0,
    sponsor: "Acme",
    drug: "Drug A",
    targetDate: "",
    tenantId: "t1",
    ownerId: "u1",
    teamSize: 0,
    teamMembers: [],
    createdAt: "",
    updatedAt: "",
    settings: { isPublic: false, allowCollaboration: true },
    targetIndSubmissionDate: "",
    preIndMeetingDate: null,
    projectStartDate: "",
    fdaContactEmail: null,
    sponsorContactEmail: "",
    additionalNotes: null,
    productType: "mab",
  },
  {
    id: "p2",
    title: "Beta",
    code: "IND-002",
    description: "",
    status: "active",
    priority: "high",
    progress: 0,
    sponsor: "BioCorp",
    drug: "Drug B",
    targetDate: "",
    tenantId: "t2",
    ownerId: "u1",
    teamSize: 0,
    teamMembers: [],
    createdAt: "",
    updatedAt: "",
    settings: { isPublic: false, allowCollaboration: true },
    targetIndSubmissionDate: "",
    preIndMeetingDate: null,
    projectStartDate: "",
    fdaContactEmail: null,
    sponsorContactEmail: "",
    additionalNotes: null,
    productType: "mab",
  },
];

describe("lib/header/headerViewModel", () => {
  it("maps breadcrumb text by view", () => {
    expect(getBreadcrumbText("projects")).toBe("Projects");
    expect(getBreadcrumbText("workspace")).toBe("eCTD Workspace");
  });

  it("returns visible/effective projects by tenant", () => {
    expect(
      getVisibleProjects({
        projects,
        selectedTenantId: "t1",
      }).map((project) => project.id),
    ).toEqual(["p1"]);

    expect(
      getEffectiveProjects({
        projects,
        selectedTenantId: "missing",
      }).map((project) => project.id),
    ).toEqual(["p1", "p2"]);
  });

  it("resolves tenant selection", () => {
    const tenants = [
      { id: "t1", name: "Tenant 1" },
      { id: "t2", name: "Tenant 2" },
    ];

    expect(
      resolveTenantSelection({
        tenants,
        selectedTenantId: null,
      }),
    ).toBe("t1");

    expect(
      resolveTenantSelection({
        tenants,
        selectedTenantId: "t2",
      }),
    ).toBe("t2");

    expect(
      resolveTenantSelection({
        tenants,
        selectedTenantId: "unknown",
      }),
    ).toBe("t1");
  });

  it("resolves project selection", () => {
    expect(
      resolveProjectSelection({
        projects,
        selectedProjectId: "p2",
      }),
    ).toBe("p2");

    expect(
      resolveProjectSelection({
        projects,
        selectedProjectId: "unknown",
      }),
    ).toBe("p1");

    expect(
      resolveProjectSelection({
        projects: [],
        selectedProjectId: null,
      }),
    ).toBeNull();
  });
});
