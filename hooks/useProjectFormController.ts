// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTenant } from "@/hooks/useTenant";
import { useTenantUsers } from "@/hooks/useTenantUsers";
import { PROJECT_CREATION_STEPS } from "@/lib/metadata/projects";
import {
  createTeamRowId,
  normalizeProjectSubmissionData,
  TEAM_ROLE_OWNER,
  type TeamMemberRow,
} from "@/lib/projects/projectFormModel";
import {
  buildProjectFormDefaults,
  getProjectFormProgress,
  isProjectFormStepValid,
  projectFormSchema,
  toProjectAndTeamRows,
  type ProjectFormValues,
} from "@/lib/projects/projectFormSchema";
import { useAppSelector } from "@/lib/store";
import type { ProjectCreation } from "@/lib/projects/types";

interface UseProjectFormControllerParams {
  initialData?: ProjectCreation;
  onSubmit: (data: ProjectCreation) => Promise<void> | void;
  isSubmitting?: boolean;
}

type ProjectFormFieldArrayValues = ProjectFormValues & {
  teamRows: TeamMemberRow[];
};

const STEP_FIELDS: Record<number, Array<keyof ProjectFormValues>> = {
  1: ["ind_title", "ind_number", "drug_name", "product_type"],
  2: ["sponsor_name", "sponsor_contact_email", "fda_contact_email"],
  3: ["project_start_date", "target_ind_submission_date"],
  4: ["teamRows"],
  5: [],
};

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

  const defaultValues = useMemo(
    () =>
      buildProjectFormDefaults({
        initialData,
        fallbackTenantId: defaultTenantId,
        ownerUserId,
      }),
    [defaultTenantId, initialData, ownerUserId],
  );

  const { control, formState, getValues, handleSubmit: handleFormSubmit, reset, setValue, trigger, watch } =
    useForm<ProjectFormFieldArrayValues>({
      resolver: zodResolver(projectFormSchema),
      defaultValues,
      mode: "onChange",
      reValidateMode: "onChange",
    });

  const { append, remove, replace } = useFieldArray<
    ProjectFormFieldArrayValues,
    "teamRows",
    "fieldKey"
  >({
    control,
    name: "teamRows",
    keyName: "fieldKey",
  });

  const { users: tenantUsers, error: usersLoadError } =
    useTenantUsers(defaultTenantId);

  const formValues = watch();
  const { teamRows = [], ...projectValues } = formValues;
  const projectData = projectValues as ProjectCreation;

  useEffect(() => {
    const rows = getValues("teamRows") ?? [];
    if (!rows.length) {
      replace([
        {
          id: createTeamRowId(),
          userId: ownerUserId,
          role: TEAM_ROLE_OWNER,
        },
      ]);
      return;
    }

    const [ownerRow, ...restRows] = rows;
    replace([
      {
        ...ownerRow,
        userId: ownerUserId,
        role: TEAM_ROLE_OWNER,
      },
      ...restRows,
    ]);
  }, [getValues, ownerUserId, replace]);

  useEffect(() => {
    setValue("tenantid", defaultTenantId, { shouldValidate: true });
  }, [defaultTenantId, setValue]);

  const progress = getProjectFormProgress(currentStep);
  const stepValid = isProjectFormStepValid({
    currentStep,
    values: {
      ...formValues,
      teamRows: teamRows as TeamMemberRow[],
    },
  });

  const sponsorEmail =
    typeof projectData.sponsor_contact_email === "string"
      ? projectData.sponsor_contact_email.trim()
      : "";
  const fdaEmail =
    typeof projectData.fda_contact_email === "string"
      ? projectData.fda_contact_email.trim()
      : "";

  const sponsorEmailValid = !formState.errors.sponsor_contact_email;
  const fdaEmailValid = !formState.errors.fda_contact_email;

  const nextStep = async () => {
    if (currentStep >= PROJECT_CREATION_STEPS.length) return;

    const stepFields = STEP_FIELDS[currentStep] ?? [];
    const isValid = stepFields.length
      ? await trigger(stepFields as Array<keyof ProjectFormValues>, {
          shouldFocus: true,
        })
      : true;

    if (!isValid) return;
    setCurrentStep((previousStep) => previousStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((previousStep) => previousStep - 1);
    }
  };

  const addTeamRow = () => {
    append({ id: createTeamRowId(), userId: "", role: "" });
  };

  const removeTeamRow = (rowId: string) => {
    const rows = getValues("teamRows") ?? [];
    const index = rows.findIndex(
      (row) => row.id === rowId && row.role !== TEAM_ROLE_OWNER,
    );
    if (index === -1) return;
    remove(index);
  };

  const updateTeamRow = (
    rowId: string,
    updates: Partial<Pick<TeamMemberRow, "userId" | "role">>,
  ) => {
    const rows = getValues("teamRows") ?? [];
    const index = rows.findIndex((row) => row.id === rowId);
    if (index === -1) return;

    if (updates.userId !== undefined) {
      setValue(`teamRows.${index}.userId` as never, updates.userId as never, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    if (updates.role !== undefined) {
      setValue(`teamRows.${index}.role` as never, updates.role as never, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  const updateProjectData = <T extends keyof ProjectCreation>(
    field: T,
    value: ProjectCreation[T],
  ) => {
    setValue(field as never, value as never, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleSubmit = () => {
    void handleFormSubmit(async (values) => {
      if (isSubmitting) return;

      const tenantMeta = currentTenant
        ? { id: currentTenant.id, name: currentTenant.name }
        : selectedTenantId
          ? { id: selectedTenantId }
          : null;

      const { projectData: projectPayload, teamRows: submittedTeamRows } =
        toProjectAndTeamRows(values);

      const submissionData = normalizeProjectSubmissionData({
        projectData: projectPayload,
        tenantMeta,
        teamRows: submittedTeamRows,
      });

      try {
        await onSubmit(submissionData);
        reset(
          buildProjectFormDefaults({
            initialData,
            fallbackTenantId: defaultTenantId,
            ownerUserId,
          }),
        );
        setCurrentStep(1);
      } catch {
        // Keep form state when submit fails so user can retry.
      }
    })();
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
    sponsorEmail,
    fdaEmail,
    sponsorEmailValid,
    fdaEmailValid,
    nextStep,
    prevStep,
    addTeamRow,
    removeTeamRow,
    updateTeamRow,
    updateProjectData,
    handleSubmit,
  };
}
