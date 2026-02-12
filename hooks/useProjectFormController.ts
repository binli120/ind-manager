// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import { useEffect, useMemo, useState } from "react";
import { useTenant } from "@/hooks/useTenant";
import { useTenantUsers } from "@/hooks/useTenantUsers";
import {
  PROJECT_CREATION_STEPS,
  getDefaultProjectData,
} from "@/lib/metadata/projects";
import {
  buildTeamRows,
  createTeamRowId,
  normalizeProjectSubmissionData,
  TEAM_ROLE_OWNER,
  type TeamMemberRow,
} from "@/lib/projects/projectFormModel";
import {
  getContactEmailValidation,
  getProjectFormProgress,
  isProjectStepValid,
  withProjectTenantId,
} from "@/lib/projects/projectFormViewModel";
import { useAppSelector } from "@/lib/store";
import type { ProjectCreation } from "@/lib/projects/types";

interface UseProjectFormControllerParams {
  initialData?: ProjectCreation;
  onSubmit: (data: ProjectCreation) => Promise<void> | void;
  isSubmitting?: boolean;
}

export function useProjectFormController({
  initialData,
  onSubmit,
  isSubmitting = false,
}: UseProjectFormControllerParams) {
  const { user } = useAppSelector((state) => state.auth);
  const { currentTenant, selectedTenantId } = useTenant();
  const defaultTenantId = selectedTenantId ?? currentTenant?.id ?? "demo-tenant";
  const ownerUserId = user?.id ?? "";
  const ownerDisplayName = user?.name?.trim() || user?.email || "Current User";

  const [currentStep, setCurrentStep] = useState(1);
  const [projectData, setProjectData] = useState<ProjectCreation>(() =>
    withProjectTenantId({ projectData: initialData, fallbackTenantId: defaultTenantId }),
  );
  const [teamRows, setTeamRows] = useState<TeamMemberRow[]>(() =>
    buildTeamRows(initialData, ownerUserId),
  );

  const { users: tenantUsers, error: usersLoadError } =
    useTenantUsers(defaultTenantId);

  useEffect(() => {
    setTeamRows((previousRows) => {
      if (!previousRows.length) {
        return [
          {
            id: createTeamRowId(),
            userId: ownerUserId,
            role: TEAM_ROLE_OWNER,
          },
        ];
      }

      const [ownerRow, ...remainingRows] = previousRows;
      return [
        { ...ownerRow, userId: ownerUserId, role: TEAM_ROLE_OWNER },
        ...remainingRows,
      ];
    });
  }, [ownerUserId]);

  const progress = getProjectFormProgress(currentStep);
  const contactValidation = useMemo(
    () => getContactEmailValidation(projectData),
    [projectData],
  );
  const stepValid = useMemo(
    () =>
      isProjectStepValid({
        currentStep,
        projectData,
        teamRows,
      }),
    [currentStep, projectData, teamRows],
  );

  const nextStep = () => {
    if (currentStep < PROJECT_CREATION_STEPS.length) {
      setCurrentStep((previousStep) => previousStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((previousStep) => previousStep - 1);
    }
  };

  const addTeamRow = () => {
    setTeamRows((previousRows) => [
      ...previousRows,
      { id: createTeamRowId(), userId: "", role: "" },
    ]);
  };

  const removeTeamRow = (rowId: string) => {
    setTeamRows((previousRows) =>
      previousRows.filter(
        (row) => row.id !== rowId || row.role === TEAM_ROLE_OWNER,
      ),
    );
  };

  const updateTeamRow = (
    rowId: string,
    updates: Partial<Pick<TeamMemberRow, "userId" | "role">>,
  ) => {
    setTeamRows((previousRows) =>
      previousRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              ...updates,
            }
          : row,
      ),
    );
  };

  const updateProjectData = <T extends keyof ProjectCreation>(
    field: T,
    value: ProjectCreation[T],
  ) => {
    setProjectData((previousData) => ({ ...previousData, [field]: value }));
  };

  const resetForm = () => {
    setProjectData(
      withProjectTenantId({
        projectData: initialData ?? getDefaultProjectData(),
        fallbackTenantId: defaultTenantId,
      }),
    );
    setTeamRows(buildTeamRows(initialData, ownerUserId));
    setCurrentStep(1);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const tenantMeta = currentTenant
      ? { id: currentTenant.id, name: currentTenant.name }
      : selectedTenantId
        ? { id: selectedTenantId }
        : null;

    const submissionData = normalizeProjectSubmissionData({
      projectData,
      tenantMeta,
      teamRows,
    });

    try {
      await onSubmit(submissionData);
      resetForm();
    } catch {
      // Keep form state when submit fails so user can retry.
    }
  };

  return {
    currentStep,
    projectData,
    currentTenant,
    selectedTenantId,
    teamRows,
    tenantUsers,
    usersLoadError,
    ownerDisplayName,
    progress,
    stepValid,
    sponsorEmail: contactValidation.sponsorEmail,
    fdaEmail: contactValidation.fdaEmail,
    sponsorEmailValid: contactValidation.sponsorEmailValid,
    fdaEmailValid: contactValidation.fdaEmailValid,
    nextStep,
    prevStep,
    addTeamRow,
    removeTeamRow,
    updateTeamRow,
    updateProjectData,
    handleSubmit,
  };
}
