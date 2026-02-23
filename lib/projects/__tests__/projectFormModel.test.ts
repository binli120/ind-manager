// Author: Bin Lee
// Email: binlee120@gmail.com

import { getDefaultProjectData } from "@/lib/metadata/projects";
import {
  buildTeamRows,
  normalizeProjectSubmissionData,
} from "../projectFormModel";

describe("lib/projects/projectFormModel", () => {
  it("builds owner + assigned team rows from existing project data", () => {
    const rows = buildTeamRows(
      {
        ...getDefaultProjectData(),
        cmc_lead: "user-cmc",
        metadata: {
          team_assignments: {
            tech_writer: "user-tech",
            inc_writer: "user-ind",
          },
        },
      },
      "owner-user",
    );

    expect(rows.map((row) => row.role)).toEqual([
      "owner",
      "cmc_lead",
      "tech_writer",
      "ind_writer",
    ]);
    expect(rows[0].userId).toBe("owner-user");
  });

  it("normalizes team assignments into project payload", () => {
    const payload = normalizeProjectSubmissionData({
      projectData: {
        ...getDefaultProjectData(),
        sponsor_contact_email: " sponsor@acme.com ",
        fda_contact_email: "",
      },
      tenantMeta: { id: "tenant-1", name: "Acme" },
      teamRows: [
        { id: "1", userId: "owner-1", role: "owner" },
        { id: "2", userId: "cmc-1", role: "cmc_lead" },
        { id: "3", userId: "tech-1", role: "tech_writer" },
        { id: "4", userId: "ind-1", role: "ind_writer" },
      ],
    });

    const metadata = payload.metadata as {
      tenant?: { id: string; name?: string };
      team_assignments?: {
        tech_writer?: string;
        ind_writer?: string;
        inc_writer?: string;
      };
    };

    expect(payload.sponsor_contact_email).toBe("sponsor@acme.com");
    expect(payload.fda_contact_email).toBeNull();
    expect(payload.cmc_lead).toBe("cmc-1");
    expect(metadata.tenant?.id).toBe("tenant-1");
    expect(metadata.team_assignments).toEqual({
      tech_writer: "tech-1",
      ind_writer: "ind-1",
      inc_writer: "ind-1",
    });
  });
});
