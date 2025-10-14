/**
 * Project-related metadata, constants, and utility functions
 */

import { Project, ProjectCreation } from "../store/slices/projectsSlice";

export const PROJECT_STATUSES = {
  DRAFT: "draft",
  IN_PROGRESS: "in-progress",
  REVIEW: "review",
  READY: "ready",
  SUBMITTED: "submitted",
  APPROVED: "approved",
} as const;

export type ProjectStatus =
  (typeof PROJECT_STATUSES)[keyof typeof PROJECT_STATUSES];

export const PROJECT_PRIORITIES = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
} as const;

export type ProjectPriority =
  (typeof PROJECT_PRIORITIES)[keyof typeof PROJECT_PRIORITIES];

export const PRODUCT_TYPES = [
  { value: "small-molecule", label: "Small Molecule" },
  { value: "biologic", label: "Biologic" },
  { value: "biosimilar", label: "Biosimilar" },
  { value: "gene-therapy", label: "Gene Therapy" },
  { value: "cell-therapy", label: "Cell Therapy" },
  { value: "other", label: "Other" },
] as const;

export const PROJECT_CREATION_STEPS = [
  {
    id: 1,
    title: "Basic Information",
    description: "Project details and drug information",
    requiredFields: ["ind_title", "drug_name", "product_type"],
  },
  {
    id: 2,
    title: "Sponsor & Contacts",
    description: "Sponsor information and FDA contacts",
    requiredFields: [
      "sponsor_name",
      "sponsor_contact_email",
      "fda_contact_email",
    ],
  },
  {
    id: 3,
    title: "Timeline",
    description: "Set project milestones and deadlines",
    requiredFields: ["project_start_date", "ind_submission_date"],
  },
  {
    id: 4,
    title: "Review & Create",
    description: "Review and finalize project setup",
    requiredFields: [],
  },
] as const;

export const getStatusColor = (status: ProjectStatus): string => {
  const statusColors = {
    [PROJECT_STATUSES.DRAFT]: "bg-gray-500",
    [PROJECT_STATUSES.IN_PROGRESS]: "bg-blue-500",
    [PROJECT_STATUSES.REVIEW]: "bg-yellow-500",
    [PROJECT_STATUSES.READY]: "bg-green-500",
    [PROJECT_STATUSES.SUBMITTED]: "bg-purple-500",
    [PROJECT_STATUSES.APPROVED]: "bg-green-600",
  };
  return statusColors[status] || "bg-gray-500";
};

export const getStatusText = (status: ProjectStatus): string => {
  const statusTexts = {
    [PROJECT_STATUSES.DRAFT]: "Draft",
    [PROJECT_STATUSES.IN_PROGRESS]: "In Progress",
    [PROJECT_STATUSES.REVIEW]: "In Review",
    [PROJECT_STATUSES.READY]: "Ready",
    [PROJECT_STATUSES.SUBMITTED]: "Submitted",
    [PROJECT_STATUSES.APPROVED]: "Approved",
  };
  return statusTexts[status] || status;
};

export const getPriorityColor = (priority: ProjectPriority): string => {
  const priorityColors = {
    [PROJECT_PRIORITIES.LOW]: "bg-green-500",
    [PROJECT_PRIORITIES.MEDIUM]: "bg-yellow-500",
    [PROJECT_PRIORITIES.HIGH]: "bg-orange-500",
    [PROJECT_PRIORITIES.CRITICAL]: "bg-red-500",
  };
  return priorityColors[priority] || "bg-gray-500";
};

export const validateProjectStep = (
  step: number,
  projectData: Record<string, unknown>,
): boolean => {
  const stepConfig = PROJECT_CREATION_STEPS.find((s) => s.id === step);
  if (!stepConfig) return false;

  return (stepConfig.requiredFields as readonly string[]).every(
    (field) =>
      projectData[field] &&
      typeof projectData[field] === "string" &&
      (projectData[field] as string).trim(),
  );
};

// Default project form data
export const getDefaultProjectData: () => ProjectCreation = () => ({
  ind_title: "",
  drug_name: "",
  product_type: "",
  sponsor_name: "",
  sponsor_contact_email: "",
  fda_contact_email: "",
  team_id: "",
  cmc_lead: "",
  clinical_lead: "",
  preclinical_lead: "",
  regulatory_owner: "",
  publisher: "",
  target_ind_submission_date: "",
  pre_ind_meeting_date: "",
  additional_notes: "",
  // Timeline fields
  project_start_date: "",
  ind_submission_date: "",
  phase_1_start_date: "",
  phase_1_end_date: "",
  phase_2_start_date: "",
  phase_2_end_date: "",
  phase_3_start_date: "",
  phase_3_end_date: "",
  nda_submission_date: "",
  fda_approval_date: "",
});
