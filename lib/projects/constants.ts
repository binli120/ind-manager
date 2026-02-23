// Author: Bin Lee
// Email: binlee120@gmail.com

import type { Project } from "@/lib/projects/types";

export const PROJECTS_PAGE_SIZE = 6;
export const DELETE_PROJECT_CONFIRMATION_MESSAGE =
  'Are you sure you wish to delete this project? This action cannot be undone.';

type ProjectBadgeConfig = {
  label: string;
  color: string;
};

export type ProjectStatusFilterOption =
  | { header: string }
  | { value: Project["status"]; label: string };

export const PROJECT_STATUS_FILTER_OPTIONS: ProjectStatusFilterOption[] = [
  { header: "Pre-Submission" },
  { value: "draft", label: "Draft" },
  { value: "pre-ind-meeting-requested", label: "Pre-IND Meeting Requested" },
  { value: "pre-ind-meeting-completed", label: "Pre-IND Meeting Completed" },
  { header: "Submission & Review" },
  { value: "submitted", label: "Submitted" },
  { value: "under-review", label: "Under Review" },
  { value: "active", label: "Active" },
  { header: "Hold States" },
  { value: "clinical-hold-complete", label: "Clinical Hold - Complete" },
  { value: "clinical-hold-partial", label: "Clinical Hold - Partial" },
  { header: "Other States" },
  {
    value: "inactive",
    label:
      "Inactive - No subjects enrolled for 2+ years OR on clinical hold for >=1 year",
  },
  { value: "withdrawn", label: "Withdrawn - (can be reactivated)" },
  {
    value: "terminated",
    label: "Terminated - (serious deficiencies or inactive >=5 years)",
  },
];

export const PROJECT_PRIORITY_FILTER_OPTIONS: Array<{
  value: "all" | Project["priority"];
  label: string;
}> = [
  { value: "all", label: "All Priority" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export const PROJECT_STATUS_BADGE_CONFIG: Record<
  Project["status"],
  ProjectBadgeConfig
> = {
  draft: { label: "Draft", color: "bg-slate-100 text-slate-800 border-slate-200" },
  "pre-ind-meeting-requested": {
    label: "Pre-IND Requested",
    color: "bg-amber-100 text-amber-800 border-amber-200",
  },
  "pre-ind-meeting-completed": {
    label: "Pre-IND Completed",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  submitted: { label: "Submitted", color: "bg-blue-100 text-blue-800 border-blue-200" },
  "under-review": {
    label: "Under Review",
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
  active: { label: "Active", color: "bg-green-100 text-green-800 border-green-200" },
  "clinical-hold-complete": {
    label: "Clinical Hold - Complete",
    color: "bg-red-100 text-red-800 border-red-200",
  },
  "clinical-hold-partial": {
    label: "Clinical Hold - Partial",
    color: "bg-orange-100 text-orange-800 border-orange-200",
  },
  inactive: { label: "Inactive", color: "bg-slate-100 text-slate-800 border-slate-200" },
  withdrawn: { label: "Withdrawn", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  terminated: { label: "Terminated", color: "bg-rose-100 text-rose-800 border-rose-200" },
};

export const PROJECT_PRIORITY_BADGE_CONFIG: Record<
  Project["priority"],
  ProjectBadgeConfig
> = {
  low: { label: "Low", color: "bg-gray-100 text-gray-600" },
  medium: { label: "Medium", color: "bg-amber-100 text-amber-700" },
  high: { label: "High", color: "bg-orange-100 text-orange-700" },
  critical: { label: "Critical", color: "bg-red-100 text-red-700" },
};

export const isProjectStatusFilterHeader = (
  option: ProjectStatusFilterOption,
): option is { header: string } => "header" in option;
