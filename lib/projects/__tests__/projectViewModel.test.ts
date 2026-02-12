// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import type { Project } from "@/lib/projects/types";
import {
  filterProjects,
  mapProjectToEditFormData,
  paginateProjects,
} from "../projectViewModel";

const baseProject: Project = {
  id: "p1",
  title: "Alpha IND",
  code: "IND-001",
  description: "desc",
  status: "draft",
  priority: "high",
  progress: 50,
  sponsor: "Acme",
  drug: "LT3114",
  targetDate: "2027-01-01",
  tenantId: "tenant-1",
  ownerId: "u1",
  teamSize: 0,
  teamMembers: [],
  createdAt: "2026-01-01",
  updatedAt: "2026-01-02",
  settings: {
    isPublic: false,
    allowCollaboration: true,
  },
  metadata: {},
  targetIndSubmissionDate: "2027-01-01",
  preIndMeetingDate: "2026-02-01",
  projectStartDate: "2026-01-01",
  fdaContactEmail: null,
  sponsorContactEmail: "owner@acme.com",
  additionalNotes: null,
  productType: "mab",
  cmcLead: null,
  clinicalLead: null,
  preclinicalLead: null,
  regulatoryOwner: null,
  publisher: null,
  techWriter: "u-tech",
  indWriter: "u-ind",
  userRole: null,
};

describe("lib/projects/projectViewModel", () => {
  it("filters by search/status/priority", () => {
    const projects: Project[] = [
      baseProject,
      {
        ...baseProject,
        id: "p2",
        title: "Beta",
        sponsor: "BioCorp",
        drug: "Drug X",
        status: "active",
        priority: "low",
      },
    ];

    const filtered = filterProjects(projects, {
      search: "alpha",
      status: "draft",
      priority: "high",
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("p1");
  });

  it("paginates projects", () => {
    const projects: Project[] = [
      { ...baseProject, id: "p1" },
      { ...baseProject, id: "p2" },
      { ...baseProject, id: "p3" },
    ];

    expect(paginateProjects(projects, 1, 2).map((p) => p.id)).toEqual(["p1", "p2"]);
    expect(paginateProjects(projects, 2, 2).map((p) => p.id)).toEqual(["p3"]);
  });

  it("maps project to edit form payload", () => {
    const payload = mapProjectToEditFormData(baseProject);

    expect(payload.ind_title).toBe("Alpha IND");
    expect(payload.drug_name).toBe("LT3114");
    expect(payload.metadata).toEqual({
      team_assignments: {
        tech_writer: "u-tech",
        ind_writer: "u-ind",
        inc_writer: "u-ind",
      },
    });
  });
});
