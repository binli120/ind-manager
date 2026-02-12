import { z } from "zod";
import { PROJECT_CREATION_STEPS } from "@/lib/metadata/projects";
import {
  TEAM_ROLE_OWNER,
  buildTeamRows,
  type TeamMemberRow,
} from "@/lib/projects/projectFormModel";
import { withProjectTenantId } from "@/lib/projects/projectFormViewModel";
import type { ProjectCreation } from "@/lib/projects/types";

const TEAM_ASSIGNABLE_ROLE_VALUES = [
  "cmc_lead",
  "clinical_lead",
  "preclinical_lead",
  "regulatory_owner",
  "publisher",
  "tech_writer",
  "ind_writer",
] as const;

const teamRoleSchema = z.union([
  z.literal(TEAM_ROLE_OWNER),
  z.enum(TEAM_ASSIGNABLE_ROLE_VALUES),
  z.literal(""),
]);

const teamRowSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    role: teamRoleSchema,
  })
  .superRefine((row, context) => {
    if (row.role === TEAM_ROLE_OWNER) {
      return;
    }

    if (!row.userId.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "User is required",
        path: ["userId"],
      });
    }

    if (!row.role) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Role is required",
        path: ["role"],
      });
    }
  });

const optionalEmailSchema = z.union([z.literal(""), z.string().trim().email()]);

const baseProjectFormSchema = z
  .object({
    tenantid: z.string().trim().min(1),
    ind_title: z.string().trim().min(1),
    ind_number: z.string().trim().min(1),
    drug_name: z.string().trim().min(1),
    product_type: z.string().trim().min(1),
    priority: z.enum(["low", "medium", "high", "critical"]).optional(),
    description: z.string().optional(),
    sponsor_name: z.string().trim().min(1),
    sponsor_contact_email: z.string().trim().min(1).email(),
    fda_contact_email: optionalEmailSchema.optional(),
    project_start_date: z.string().trim().min(1),
    pre_ind_meeting_date: z.string().optional(),
    target_ind_submission_date: z.string().trim().min(1),
    additional_notes: z.string().optional(),
    teamRows: z.array(teamRowSchema).min(1),
  });

export const projectFormSchema = baseProjectFormSchema;

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

const stepOneSchema = baseProjectFormSchema.pick({
  ind_title: true,
  ind_number: true,
  drug_name: true,
  product_type: true,
});

const stepTwoSchema = baseProjectFormSchema.pick({
  sponsor_name: true,
  sponsor_contact_email: true,
  fda_contact_email: true,
});

const stepThreeSchema = baseProjectFormSchema.pick({
  project_start_date: true,
  target_ind_submission_date: true,
});

const stepFourSchema = baseProjectFormSchema.pick({
  teamRows: true,
});

export const isProjectFormStepValid = ({
  currentStep,
  values,
}: {
  currentStep: number;
  values: ProjectFormValues;
}) => {
  switch (currentStep) {
    case 1:
      return stepOneSchema.safeParse(values).success;
    case 2:
      return stepTwoSchema.safeParse(values).success;
    case 3:
      return stepThreeSchema.safeParse(values).success;
    case 4:
      return stepFourSchema.safeParse(values).success;
    case 5:
      return true;
    default:
      return false;
  }
};

export const getProjectFormProgress = (currentStep: number) =>
  (currentStep / PROJECT_CREATION_STEPS.length) * 100;

export const buildProjectFormDefaults = ({
  initialData,
  fallbackTenantId,
  ownerUserId,
}: {
  initialData?: ProjectCreation;
  fallbackTenantId: string;
  ownerUserId: string;
}): ProjectFormValues => {
  const base = withProjectTenantId({
    projectData: initialData,
    fallbackTenantId,
  });

  return {
    ...base,
    tenantid: typeof base.tenantid === "string" ? base.tenantid : fallbackTenantId,
    ind_title: typeof base.ind_title === "string" ? base.ind_title : "",
    ind_number: typeof base.ind_number === "string" ? base.ind_number : "",
    drug_name: typeof base.drug_name === "string" ? base.drug_name : "",
    product_type: typeof base.product_type === "string" ? base.product_type : "",
    priority:
      base.priority === "low" ||
      base.priority === "medium" ||
      base.priority === "high" ||
      base.priority === "critical"
        ? base.priority
        : "medium",
    description: typeof base.description === "string" ? base.description : "",
    sponsor_name: typeof base.sponsor_name === "string" ? base.sponsor_name : "",
    sponsor_contact_email:
      typeof base.sponsor_contact_email === "string"
        ? base.sponsor_contact_email
        : "",
    fda_contact_email:
      typeof base.fda_contact_email === "string" ? base.fda_contact_email : "",
    project_start_date:
      typeof base.project_start_date === "string" ? base.project_start_date : "",
    pre_ind_meeting_date:
      typeof base.pre_ind_meeting_date === "string" ? base.pre_ind_meeting_date : "",
    target_ind_submission_date:
      typeof base.target_ind_submission_date === "string"
        ? base.target_ind_submission_date
        : "",
    additional_notes:
      typeof base.additional_notes === "string" ? base.additional_notes : "",
    teamRows: buildTeamRows(initialData, ownerUserId),
  };
};

export const toProjectAndTeamRows = (values: ProjectFormValues) => {
  const { teamRows, ...projectValues } = values;
  return {
    projectData: projectValues as ProjectCreation,
    teamRows: teamRows as TeamMemberRow[],
  };
};
