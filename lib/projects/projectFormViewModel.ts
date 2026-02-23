// Author: Bin Lee
// Email: binlee120@gmail.com

import {
  PROJECT_CREATION_STEPS,
  getDefaultProjectData,
  validateProjectStep,
} from "@/lib/metadata/projects";
import {
  isTeamRowsValid,
  type TeamMemberRow,
} from "@/lib/projects/projectFormModel";
import type { ProjectCreation } from "@/lib/projects/types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeTenantId = (tenantId: unknown, fallbackTenantId: string) =>
  typeof tenantId === "string" && tenantId.trim()
    ? tenantId
    : fallbackTenantId;

export const withProjectTenantId = ({
  projectData,
  fallbackTenantId,
}: {
  projectData?: ProjectCreation;
  fallbackTenantId: string;
}): ProjectCreation => {
  const base = projectData ?? getDefaultProjectData();
  return {
    ...base,
    tenantid: normalizeTenantId(base.tenantid, fallbackTenantId),
  };
};

export const getProjectFormProgress = (currentStep: number) =>
  (currentStep / PROJECT_CREATION_STEPS.length) * 100;

export const normalizeEmailInput = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export const isValidEmailFormat = ({
  value,
  required,
}: {
  value: string;
  required: boolean;
}) => {
  const normalized = normalizeEmailInput(value);
  if (!normalized) return !required;
  return EMAIL_REGEX.test(normalized);
};

export const getContactEmailValidation = (projectData: ProjectCreation) => {
  const sponsorEmail = normalizeEmailInput(projectData.sponsor_contact_email);
  const fdaEmail = normalizeEmailInput(projectData.fda_contact_email);

  return {
    sponsorEmail,
    fdaEmail,
    sponsorEmailValid: isValidEmailFormat({
      value: sponsorEmail,
      required: true,
    }),
    fdaEmailValid: isValidEmailFormat({
      value: fdaEmail,
      required: false,
    }),
  };
};

export const isProjectStepValid = ({
  currentStep,
  projectData,
  teamRows,
}: {
  currentStep: number;
  projectData: ProjectCreation;
  teamRows: TeamMemberRow[];
}) => {
  const baseStepValid = validateProjectStep(currentStep, projectData);
  if (!baseStepValid) return false;

  if (currentStep === 2) {
    const contactValidation = getContactEmailValidation(projectData);
    return contactValidation.sponsorEmailValid && contactValidation.fdaEmailValid;
  }

  if (currentStep === 4) {
    return isTeamRowsValid(teamRows);
  }

  return true;
};
