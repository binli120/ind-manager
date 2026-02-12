import { getDefaultProjectData } from "@/lib/metadata/projects";
import {
  getContactEmailValidation,
  isProjectStepValid,
  withProjectTenantId,
} from "../projectFormViewModel";

describe("lib/projects/projectFormViewModel", () => {
  it("applies fallback tenant id when project tenant is missing", () => {
    const base = getDefaultProjectData();
    const normalized = withProjectTenantId({
      projectData: { ...base, tenantid: "" },
      fallbackTenantId: "tenant-123",
    });

    expect(normalized.tenantid).toBe("tenant-123");
  });

  it("keeps project tenant id when present", () => {
    const base = getDefaultProjectData();
    const normalized = withProjectTenantId({
      projectData: { ...base, tenantid: "tenant-existing" },
      fallbackTenantId: "tenant-fallback",
    });

    expect(normalized.tenantid).toBe("tenant-existing");
  });

  it("validates sponsor and FDA contact emails", () => {
    const base = getDefaultProjectData();
    const validation = getContactEmailValidation({
      ...base,
      sponsor_contact_email: " sponsor@company.com ",
      fda_contact_email: "",
    });

    expect(validation.sponsorEmail).toBe("sponsor@company.com");
    expect(validation.sponsorEmailValid).toBe(true);
    expect(validation.fdaEmailValid).toBe(true);
  });

  it("requires valid email format on sponsor and optional FDA fields", () => {
    const base = getDefaultProjectData();
    const invalidStepTwoData = {
      ...base,
      sponsor_name: "Acme",
      sponsor_contact_email: "invalid",
      fda_contact_email: "fda.gov",
    };

    const validTeamRows = [
      { id: "1", userId: "owner-1", role: "owner" as const },
    ];

    expect(
      isProjectStepValid({
        currentStep: 2,
        projectData: invalidStepTwoData,
        teamRows: validTeamRows,
      }),
    ).toBe(false);
  });

  it("requires team rows to be complete on team step", () => {
    const base = getDefaultProjectData();
    const stepFourData = {
      ...base,
      ind_title: "Title",
      ind_number: "IND-1",
      drug_name: "Drug",
      product_type: "mab",
      sponsor_name: "Acme",
      sponsor_contact_email: "owner@acme.com",
      project_start_date: "2026-02-12",
      target_ind_submission_date: "2027-02-12",
    };

    expect(
      isProjectStepValid({
        currentStep: 4,
        projectData: stepFourData,
        teamRows: [
          { id: "1", userId: "owner-1", role: "owner" as const },
          { id: "2", userId: "", role: "cmc_lead" as const },
        ],
      }),
    ).toBe(false);
  });
});
