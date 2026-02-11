// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  getDefaultProjectData,
  PRODUCT_TYPES,
  PROJECT_CREATION_STEPS,
  validateProjectStep,
} from "@/lib/metadata/projects";
import {
  ProjectCreation,
} from "@/lib/store/slices/projectsSlice";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTenant } from "@/hooks/useTenant";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
] as const;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ProjectFormProps {
  initialData?: ProjectCreation;
  onSubmit: (data: ProjectCreation) => Promise<void> | void;
  onCancel: () => void;
  isEditing?: boolean;
  isSubmitting?: boolean;
  submitError?: string | null;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
  isSubmitting = false,
  submitError,
}) => {
  const { currentTenant, selectedTenantId } = useTenant();
  const defaultTenantId = selectedTenantId ?? currentTenant?.id ?? "demo-tenant";
  const [currentStep, setCurrentStep] = useState(1);
  const [projectData, setProjectData] = useState<ProjectCreation>(() => {
    const base = initialData || getDefaultProjectData();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { ...base, tenantid: (base as any).tenantid || defaultTenantId };
  });

  const progress = (currentStep / PROJECT_CREATION_STEPS.length) * 100;

  const nextStep = () => {
    if (currentStep < PROJECT_CREATION_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const sponsorEmail =
    typeof projectData.sponsor_contact_email === "string"
      ? projectData.sponsor_contact_email.trim()
      : "";
  const fdaEmail =
    typeof projectData.fda_contact_email === "string"
      ? projectData.fda_contact_email.trim()
      : "";
  const sponsorEmailValid = EMAIL_REGEX.test(sponsorEmail);
  const fdaEmailValid = !fdaEmail || EMAIL_REGEX.test(fdaEmail);

  const isStepValid = () => {
    const baseStepValid = validateProjectStep(currentStep, projectData);
    if (!baseStepValid) return false;
    if (currentStep !== 2) return true;
    return sponsorEmailValid && fdaEmailValid;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const tenantMeta = currentTenant
      ? { id: currentTenant.id, name: currentTenant.name }
      : selectedTenantId
        ? { id: selectedTenantId }
        : null;
    const baseMetadata =
      projectData.metadata &&
      typeof projectData.metadata === "object" &&
      !Array.isArray(projectData.metadata)
        ? (projectData.metadata as Record<string, unknown>)
        : {};
    const nextData = tenantMeta
      ? { ...projectData, metadata: { ...baseMetadata, tenant: tenantMeta } }
      : projectData;

    const normalizedData = {
      ...nextData,
      sponsor_contact_email:
        typeof nextData.sponsor_contact_email === "string"
          ? nextData.sponsor_contact_email.trim()
          : nextData.sponsor_contact_email,
      fda_contact_email:
        typeof nextData.fda_contact_email === "string" &&
          !nextData.fda_contact_email.trim()
          ? null
          : typeof nextData.fda_contact_email === "string"
            ? nextData.fda_contact_email.trim()
            : nextData.fda_contact_email,
    };

    try {
      await onSubmit(normalizedData);
      setProjectData({
        ...(initialData || getDefaultProjectData()),
        tenantid: defaultTenantId,
      });
      setCurrentStep(1);
    } catch {
      // Keep form state when submit fails so user can retry.
    }
  };

  const updateProjectData = <T extends keyof ProjectCreation>(
    field: T,
    value: ProjectCreation[T]
  ) => {
    setProjectData((prev) => ({ ...prev, [field]: value }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="ind_title">IND Title *</Label>
                <Input
                  id="ind_title"
                  value={(projectData.ind_title as string) || ""}
                  onChange={(e) =>
                    updateProjectData("ind_title", e.target.value)
                  }
                  placeholder="e.g., Phase 1 Study of XYZ-123 in Oncology"
                />
              </div>
              <div>
                <Label htmlFor="ind_number">Drug / Asset Code *</Label>
                <Input
                  id="ind_number"
                  value={(projectData.ind_number as string) || ""}
                  onChange={(e) =>
                    updateProjectData("ind_number", e.target.value)
                  }
                  placeholder="e.g., ABC-001"
                />
              </div>
              <div>
                <Label htmlFor="drug_name">Drug Name *</Label>
                <Input
                  id="drug_name"
                  value={(projectData.drug_name as string) || ""}
                  onChange={(e) =>
                    updateProjectData("drug_name", e.target.value)
                  }
                  placeholder="e.g., XYZ-123"
                />
              </div>
              <div>
                <Label htmlFor="product_type">Product Type *</Label>
                <Select
                  value={(projectData.product_type as string) || ''}
                  onValueChange={(value) =>
                    updateProjectData('product_type', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select product type' />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={(projectData.priority as string) || "medium"}
                  onValueChange={(value) => updateProjectData("priority", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={(projectData.description as string) || ""}
                  onChange={(e) =>
                    updateProjectData("description", e.target.value)
                  }
                  placeholder="Brief description of the program"
                />
              </div>
              <div>
                <Label htmlFor="tenant_name">Tenant</Label>
                <Input
                  id="tenant_name"
                  value={
                    currentTenant?.name ??
                    (selectedTenantId ? "Tenant selected" : "No tenant selected")
                  }
                  disabled
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className='space-y-4'>
            <div className='grid gap-4'>
              <div>
                <Label htmlFor='sponsor_name'>Sponsor Name *</Label>
                <Input
                  id='sponsor_name'
                  value={(projectData.sponsor_name as string) || ''}
                  onChange={(e) =>
                    updateProjectData('sponsor_name', e.target.value)
                  }
                  placeholder='e.g., PharmaCorp Inc.'
                />
              </div>
              <div>
                <Label htmlFor='sponsor_contact_email'>
                  Sponsor Contact Email *
                </Label>
                <Input
                  id='sponsor_contact_email'
                  type='text'
                  value={(projectData.sponsor_contact_email as string) || ''}
                  onChange={(e) =>
                    updateProjectData('sponsor_contact_email', e.target.value)
                  }
                  placeholder='sponsor@company.com'
                />
                {sponsorEmail && !sponsorEmailValid && (
                  <p className='mt-1 text-xs text-red-500'>
                    Enter a valid email address.
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor='fda_contact_email'>FDA Contact Email</Label>
                <Input
                  id='fda_contact_email'
                  type='text'
                  value={(projectData.fda_contact_email as string) || ''}
                  onChange={(e) =>
                    updateProjectData('fda_contact_email', e.target.value)
                  }
                  placeholder='fda.contact@fda.gov'
                />
                {fdaEmail && !fdaEmailValid && (
                  <p className='mt-1 text-xs text-red-500'>
                    Enter a valid email address.
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className='space-y-4'>
            <div className='grid gap-4'>
              <div>
                <Label htmlFor='project_start_date'>Project Start Date *</Label>
                <Input
                  id='project_start_date'
                  type='date'
                  value={(projectData.project_start_date as string) || ''}
                  onChange={(e) =>
                    updateProjectData('project_start_date', e.target.value)
                  }
                />
              </div>
              <div>
                <Label htmlFor='pre_ind_meeting_date'>
                  Pre-IND Meeting Date
                </Label>
                <Input
                  id='pre_ind_meeting_date'
                  type='date'
                  value={(projectData.pre_ind_meeting_date as string) || ''}
                  onChange={(e) =>
                    updateProjectData('pre_ind_meeting_date', e.target.value)
                  }
                />
              </div>
              <div>
                <Label htmlFor='target_ind_submission_date'>
                  Target IND Submission Date *
                </Label>
                <Input
                  id='target_ind_submission_date'
                  type='date'
                  value={
                    (projectData.target_ind_submission_date as string) || ''
                  }
                  onChange={(e) =>
                    updateProjectData(
                      'target_ind_submission_date',
                      e.target.value
                    )
                  }
                />
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className='space-y-4'>
            <div className='grid gap-4'>
              <div className='space-y-2'>
                <Label>Project Summary</Label>
                <div className="p-4 border rounded-lg bg-muted/20 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">IND Title:</span>
                    <span>
                  {(projectData.ind_title as string) || "Not specified"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Drug / Asset Code:</span>
                <span>
                  {(projectData.ind_number as string) || "Not specified"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Drug Name:</span>
                <span>
                  {(projectData.drug_name as string) || "Not specified"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Product Type:</span>
                <span>
                  {(projectData.product_type as string) || "Not specified"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Sponsor:</span>
                <span>
                  {(projectData.sponsor_name as string) || "Not specified"}
                </span>
              </div>
                  {(projectData.target_ind_submission_date as string) && (
                    <div className='flex justify-between'>
                      <span className='font-medium'>Target Date:</span>
                      <span>
                        {new Date(
                          projectData.target_ind_submission_date as string
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor='additional_notes'>Additional Notes</Label>
                <Textarea
                  id='additional_notes'
                  value={(projectData.additional_notes as string) || ''}
                  onChange={(e) =>
                    updateProjectData('additional_notes', e.target.value)
                  }
                  placeholder='Any additional notes or comments'
                />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
      <div className='mx-4 flex h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-background shadow-lg'>
        <div className='flex shrink-0 flex-col p-6 pb-4'>
          <div className='mb-4'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <h2 className='text-xl font-semibold'>
                  {isEditing ? 'Edit' : 'Create'} IND Project
                </h2>
                <span className='text-sm text-muted-foreground'>
                  Step {currentStep} of {PROJECT_CREATION_STEPS.length}
                </span>
              </div>
              <span className='text-sm italic text-red-500'>* required</span>
            </div>
            <Progress value={progress} className='mb-4' />
            <div className='grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 sm:text-sm'>
              {PROJECT_CREATION_STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`flex-1 text-center ${
                    step.id === currentStep
                      ? 'text-primary font-medium'
                      : step.id < currentStep
                      ? 'text-green-600'
                      : 'text-muted-foreground'
                  }`}
                >
                  {step.title}
                </div>
              ))}
            </div>
          </div>
        </div>

          {/* Step Content */}
        <div className='min-h-0 flex-1 px-6'>
          <Card className='card-dark-border flex h-full min-h-0 flex-col'>
            <CardHeader>
              <CardTitle className='text-lg'>
                {PROJECT_CREATION_STEPS[currentStep - 1].title}
              </CardTitle>
              <CardDescription>
                {PROJECT_CREATION_STEPS[currentStep - 1].description}
              </CardDescription>
            </CardHeader>
            <CardContent className='min-h-0 flex-1 overflow-y-auto pb-6'>
              {renderStepContent()}
            </CardContent>
          </Card>
        </div>

          {/* Navigation */}
        <div className='mt-4 flex shrink-0 justify-between p-6 pt-0'>
            <Button
              type='button'
              variant='outline'
              onClick={prevStep}
              disabled={currentStep === 1 || isSubmitting}
            >
              <ChevronLeft className='h-4 w-4 mr-2' />
              Previous
            </Button>
            <div className='flex gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              {currentStep === PROJECT_CREATION_STEPS.length ? (
                <Button
                  type='button'
                  onClick={handleSubmit}
                  disabled={!isStepValid() || isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  ) : (
                    <Check className='h-4 w-4 mr-2' />
                  )}
                  {isSubmitting
                    ? isEditing
                      ? "Updating..."
                      : "Creating..."
                    : isEditing
                      ? "Update"
                      : "Create"}{" "}
                  Project
                </Button>
              ) : (
                <Button
                  type='button'
                  onClick={nextStep}
                  disabled={!isStepValid() || isSubmitting}
                >
                  Next
                  <ChevronRight className='h-4 w-4 ml-2' />
                </Button>
              )}
            </div>
          </div>
          {submitError && (
            <p className='px-6 pb-4 text-sm text-red-500'>{submitError}</p>
          )}
      </div>
    </div>
  );
};
