// Author: Bin Lee
// Email: binlee120@gmail.com

import type { Project } from "@/lib/projects/types";

export type HeaderView =
  | "workspace"
  | "projects"
  | "calendar"
  | "submission"
  | "post-submission"
  | "gap-scoring"
  | "review-center"
  | "tenants"
  | "users"
  | "gap-analysis"
  | "ind-submission"
  | "design-system";

export type HeaderTenant = {
  id: string;
  name: string;
};

export const getBreadcrumbText = (view: HeaderView) => {
  switch (view) {
    case "projects":
      return "Projects";
    case "calendar":
      return "Calendar";
    case "submission":
      return "Submission";
    case "post-submission":
      return "Post Submission";
    case "gap-scoring":
      return "Test Gap Scoring";
    case "review-center":
      return "Review Center";
    case "gap-analysis":
      return "Gap Analysis";
    case "tenants":
      return "Tenants";
    case "users":
      return "Users";
    default:
      return "eCTD Workspace";
  }
};

export const getVisibleProjects = ({
  projects,
  selectedTenantId,
}: {
  projects: Project[];
  selectedTenantId: string | null | undefined;
}) =>
  selectedTenantId
    ? projects.filter((project) => project.tenantId === selectedTenantId)
    : projects;

export const getEffectiveProjects = ({
  projects,
  selectedTenantId,
}: {
  projects: Project[];
  selectedTenantId: string | null | undefined;
}) => {
  const visibleProjects = getVisibleProjects({
    projects,
    selectedTenantId,
  });

  return visibleProjects.length ? visibleProjects : projects;
};

export const resolveTenantSelection = ({
  tenants,
  selectedTenantId,
}: {
  tenants: HeaderTenant[];
  selectedTenantId: string | null | undefined;
}) => {
  if (!tenants.length) return null;
  if (!selectedTenantId) return tenants[0].id;

  const exists = tenants.some((tenant) => tenant.id === selectedTenantId);
  return exists ? selectedTenantId : tenants[0].id;
};

export const resolveProjectSelection = ({
  projects,
  selectedProjectId,
}: {
  projects: Project[];
  selectedProjectId: string | null | undefined;
}) => {
  if (!projects.length) return null;
  if (!selectedProjectId) return projects[0].id;

  const exists = projects.some((project) => project.id === selectedProjectId);
  return exists ? selectedProjectId : projects[0].id;
};
