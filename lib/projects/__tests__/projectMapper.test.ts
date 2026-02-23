// Author: Bin Lee
// Email: binlee120@gmail.com

import type { Database } from "@/lib/supabase/schema";
import {
  dbToClientProject,
  getTenantNameFromMetadata,
  getWriterAssignmentsFromMetadata,
  mapProjectRowsToProjects,
} from "../projectMapper";

const baseProjectRow: Database["public"]["Tables"]["projects"]["Row"] = {
  additional_notes: null,
  clinical_lead: null,
  cmc_lead: null,
  created_at: "2026-01-01T00:00:00.000Z",
  description: null,
  drug_name: "LT3114",
  fda_contact_email: null,
  id: "proj-1",
  ind_number: "IND-123",
  ind_title: "Lpathomab IND",
  metadata: null,
  pre_ind_meeting_date: "2026-02-01",
  preclinical_lead: null,
  priority: "high",
  product_type: "mab",
  progress: 42,
  project_creator_id: "user-owner",
  project_start_date: "2026-01-01",
  publisher: null,
  regulatory_owner: null,
  sponsor_contact_email: "sponsor@example.com",
  sponsor_name: "Filynai",
  status: "draft",
  target_ind_submission_date: "2027-01-01",
  tenantid: null,
  updated_at: "2026-01-02T00:00:00.000Z",
};

describe("lib/projects/projectMapper", () => {
  it("extracts tenant name from metadata", () => {
    expect(getTenantNameFromMetadata({ tenant: { name: "  acme.com  " } })).toBe(
      "acme.com",
    );
    expect(getTenantNameFromMetadata({ tenant: { name: "" } })).toBeNull();
    expect(getTenantNameFromMetadata(null)).toBeNull();
  });

  it("extracts writer assignments and falls back to inc_writer", () => {
    expect(
      getWriterAssignmentsFromMetadata({
        team_assignments: {
          tech_writer: "tech-1",
          ind_writer: "ind-1",
        },
      }),
    ).toEqual({
      techWriter: "tech-1",
      indWriter: "ind-1",
    });

    expect(
      getWriterAssignmentsFromMetadata({
        team_assignments: {
          inc_writer: "inc-legacy",
        },
      }),
    ).toEqual({
      techWriter: null,
      indWriter: "inc-legacy",
    });
  });

  it("maps DB row to UI project with fallback tenant and user role", () => {
    const mapped = dbToClientProject({
      project: {
        ...baseProjectRow,
        metadata: {
          team_assignments: {
            tech_writer: "u-tech",
            inc_writer: "u-ind",
          },
        },
      },
      fallbackTenantId: "tenant-fallback",
      userRole: "admin",
    });

    expect(mapped.tenantId).toBe("tenant-fallback");
    expect(mapped.description).toBe("No description available");
    expect(mapped.techWriter).toBe("u-tech");
    expect(mapped.indWriter).toBe("u-ind");
    expect(mapped.userRole).toBe("admin");
  });

  it("maps multiple rows and joins assignment roles", () => {
    const rows = [
      {
        ...baseProjectRow,
        id: "proj-1",
        tenantid: "tenant-a",
      },
      {
        ...baseProjectRow,
        id: "proj-2",
        tenantid: "tenant-a",
      },
    ];

    const projects = mapProjectRowsToProjects({
      rows,
      assignmentRows: [{ project_id: "proj-2", role: "viewer" }],
      fallbackTenantId: "tenant-fallback",
    });

    expect(projects).toHaveLength(2);
    expect(projects[0].userRole).toBeNull();
    expect(projects[1].userRole).toBe("viewer");
  });
});
