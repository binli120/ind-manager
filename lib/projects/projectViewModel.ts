// Author: Bin Lee
// Email: binlee120@gmail.com

import type { Project, ProjectCreation } from "@/lib/projects/types";

export type ProjectFiltersInput = {
  search: string;
  status: string;
  priority: string;
};

export const filterProjects = (
  projects: Project[],
  filters: ProjectFiltersInput,
): Project[] => {
  const normalizedSearch = filters.search.trim().toLowerCase();

  return projects.filter((project) => {
    const matchesSearch =
      !normalizedSearch ||
      project.title.toLowerCase().includes(normalizedSearch) ||
      project.sponsor.toLowerCase().includes(normalizedSearch) ||
      project.drug.toLowerCase().includes(normalizedSearch);
    const matchesStatus =
      filters.status === "all" || project.status === filters.status;
    const matchesPriority =
      filters.priority === "all" || project.priority === filters.priority;

    return matchesSearch && matchesStatus && matchesPriority;
  });
};

export const paginateProjects = (
  projects: Project[],
  page: number,
  pageSize: number,
): Project[] => projects.slice((page - 1) * pageSize, page * pageSize);

export const mapProjectToEditFormData = (project: Project): ProjectCreation => ({
  id: project.id,
  tenantid: project.tenantId ?? "",
  drug_name: project.drug,
  ind_title: project.title,
  ind_number: project.code,
  product_type: project.productType,
  description: project.description,
  sponsor_contact_email: project.sponsorContactEmail,
  sponsor_name: project.sponsor,
  fda_contact_email: project.fdaContactEmail,
  project_start_date: project.projectStartDate,
  pre_ind_meeting_date: project.preIndMeetingDate,
  target_ind_submission_date: project.targetIndSubmissionDate,
  additional_notes: project.additionalNotes,
  cmc_lead: project.cmcLead,
  clinical_lead: project.clinicalLead,
  preclinical_lead: project.preclinicalLead,
  regulatory_owner: project.regulatoryOwner,
  publisher: project.publisher,
  metadata:
    project.techWriter || project.indWriter
      ? {
          team_assignments: {
            ...(project.techWriter ? { tech_writer: project.techWriter } : {}),
            ...(project.indWriter
              ? { ind_writer: project.indWriter, inc_writer: project.indWriter }
              : {}),
          },
        }
      : undefined,
});

export const toProjectSubmitError = (error: unknown) =>
  typeof error === "string" ? error : "Failed to create project";
