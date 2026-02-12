import { getDefaultProjectData } from "@/lib/metadata/projects";
import {
  buildProjectFormDefaults,
  isProjectFormStepValid,
  projectFormSchema,
} from "../projectFormSchema";

describe("lib/projects/projectFormSchema", () => {
  it("builds defaults with tenant id and owner row", () => {
    const defaults = buildProjectFormDefaults({
      initialData: {
        ...getDefaultProjectData(),
        tenantid: "",
      },
      fallbackTenantId: "tenant-1",
      ownerUserId: "owner-1",
    });

    expect(defaults.tenantid).toBe("tenant-1");
    expect(defaults.teamRows[0]).toMatchObject({
      userId: "owner-1",
      role: "owner",
    });
  });

  it("validates required and email fields", () => {
    const defaults = buildProjectFormDefaults({
      initialData: getDefaultProjectData(),
      fallbackTenantId: "tenant-1",
      ownerUserId: "owner-1",
    });

    const invalid = {
      ...defaults,
      ind_title: "",
      sponsor_name: "Acme",
      sponsor_contact_email: "invalid",
      fda_contact_email: "also-invalid",
    };

    expect(projectFormSchema.safeParse(invalid).success).toBe(false);
  });

  it("checks step validation with zod schemas", () => {
    const defaults = buildProjectFormDefaults({
      initialData: {
        ...getDefaultProjectData(),
        tenantid: "tenant-1",
      },
      fallbackTenantId: "tenant-1",
      ownerUserId: "owner-1",
    });

    const valid = {
      ...defaults,
      ind_title: "Title",
      ind_number: "IND-1",
      drug_name: "Drug",
      product_type: "mab",
      sponsor_name: "Acme",
      sponsor_contact_email: "owner@acme.com",
      project_start_date: "2026-02-12",
      target_ind_submission_date: "2027-02-12",
      teamRows: [
        { id: "1", userId: "owner-1", role: "owner" as const },
        { id: "2", userId: "user-2", role: "cmc_lead" as const },
      ],
    };

    expect(isProjectFormStepValid({ currentStep: 1, values: valid })).toBe(true);
    expect(isProjectFormStepValid({ currentStep: 2, values: valid })).toBe(true);
    expect(isProjectFormStepValid({ currentStep: 3, values: valid })).toBe(true);
    expect(isProjectFormStepValid({ currentStep: 4, values: valid })).toBe(true);
  });
});
