import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getDefaultProjectData,
  PRODUCT_TYPES,
  PROJECT_CREATION_STEPS,
  validateProjectStep,
} from "@/lib/metadata/projects";
import {
  ProjectCreation,
} from "@/lib/store/slices/projectsSlice";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface ProjectFormProps {
  initialData?: ProjectCreation;
  onSubmit: (data: ProjectCreation) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [projectData, setProjectData] = useState<ProjectCreation>(
    initialData || getDefaultProjectData(),
  );

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

  const isStepValid = () => {
    return validateProjectStep(currentStep, projectData);
  };

  const handleSubmit = () => {
    onSubmit(projectData);
  };

  const updateProjectData = <T extends keyof ProjectCreation>(
    field: T,
    value: ProjectCreation[T],
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
                  value={(projectData.product_type as string) || ""}
                  onValueChange={(value) =>
                    updateProjectData("product_type", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product type" />
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
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="sponsor_name">Sponsor Name *</Label>
                <Input
                  id="sponsor_name"
                  value={(projectData.sponsor_name as string) || ""}
                  onChange={(e) =>
                    updateProjectData("sponsor_name", e.target.value)
                  }
                  placeholder="e.g., PharmaCorp Inc."
                />
              </div>
              <div>
                <Label htmlFor="sponsor_contact_email">
                  Sponsor Contact Email *
                </Label>
                <Input
                  id="sponsor_contact_email"
                  type="email"
                  value={(projectData.sponsor_contact_email as string) || ""}
                  onChange={(e) =>
                    updateProjectData("sponsor_contact_email", e.target.value)
                  }
                  placeholder="sponsor@company.com"
                />
              </div>
              <div>
                <Label htmlFor="fda_contact_email">FDA Contact Email *</Label>
                <Input
                  id="fda_contact_email"
                  type="email"
                  value={(projectData.fda_contact_email as string) || ""}
                  onChange={(e) =>
                    updateProjectData("fda_contact_email", e.target.value)
                  }
                  placeholder="fda.contact@fda.gov"
                />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="project_start_date">Project Start Date *</Label>
                <Input
                  id="project_start_date"
                  type="date"
                  value={(projectData.project_start_date as string) || ""}
                  onChange={(e) =>
                    updateProjectData("project_start_date", e.target.value)
                  }
                />
              </div>
              <div>
                <Label htmlFor="pre_ind_meeting_date">
                  Pre-IND Meeting Date
                </Label>
                <Input
                  id="pre_ind_meeting_date"
                  type="date"
                  value={(projectData.pre_ind_meeting_date as string) || ""}
                  onChange={(e) =>
                    updateProjectData("pre_ind_meeting_date", e.target.value)
                  }
                />
              </div>
              <div>
                <Label htmlFor="target_ind_submission_date">
                  Target IND Submission Date *
                </Label>
                <Input
                  id="target_ind_submission_date"
                  type="date"
                  value={
                    (projectData.target_ind_submission_date as string) || ""
                  }
                  onChange={(e) =>
                    updateProjectData(
                      "target_ind_submission_date",
                      e.target.value,
                    )
                  }
                />
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Project Summary</Label>
                <div className="p-4 border rounded-lg bg-muted/20 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">IND Title:</span>
                    <span>
                      {(projectData.ind_title as string) || "Not specified"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Drug Name:</span>
                    <span>
                      {(projectData.drug_name as string) || "Not specified"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Sponsor:</span>
                    <span>
                      {(projectData.sponsor_name as string) || "Not specified"}
                    </span>
                  </div>
                  {(projectData.target_ind_submission_date as string) && (
                    <div className="flex justify-between">
                      <span className="font-medium">Target Date:</span>
                      <span>
                        {new Date(
                          projectData.target_ind_submission_date as string,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="additional_notes">Additional Notes</Label>
                <Textarea
                  id="additional_notes"
                  value={(projectData.additional_notes as string) || ""}
                  onChange={(e) =>
                    updateProjectData("additional_notes", e.target.value)
                  }
                  placeholder="Any additional notes or comments"
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">
                  {isEditing ? "Edit" : "Create"} IND Project
                </h2>
                <span className="text-sm text-muted-foreground">
                  Step {currentStep} of {PROJECT_CREATION_STEPS.length}
                </span>
              </div>
              <span className="text-sm italic text-red-500">* required</span>
            </div>
            <Progress value={progress} className="mb-4" />
            <div className="flex justify-between text-sm">
              {PROJECT_CREATION_STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`flex-1 text-center ${
                    step.id === currentStep
                      ? "text-primary font-medium"
                      : step.id < currentStep
                        ? "text-green-600"
                        : "text-muted-foreground"
                  }`}
                >
                  {step.title}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <Card className="card-dark-border">
            <CardHeader>
              <CardTitle className="text-lg">
                {PROJECT_CREATION_STEPS[currentStep - 1].title}
              </CardTitle>
              <CardDescription>
                {PROJECT_CREATION_STEPS[currentStep - 1].description}
              </CardDescription>
            </CardHeader>
            <CardContent>{renderStepContent()}</CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              {currentStep === PROJECT_CREATION_STEPS.length ? (
                <Button onClick={handleSubmit} disabled={!isStepValid()}>
                  <Check className="h-4 w-4 mr-2" />
                  {isEditing ? "Update" : "Create"} Project
                </Button>
              ) : (
                <Button onClick={nextStep} disabled={!isStepValid()}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
