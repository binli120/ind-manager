// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import type { User } from "@/lib/users/types";
import type { Project } from "@/lib/projects/types";
import { useProjectAssignmentEditor } from "@/hooks/useProjectAssignmentEditor";

interface AssignProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  projects: Project[];
}

export function AssignProjectDialog({
  open,
  onOpenChange,
  user,
  projects,
}: AssignProjectDialogProps) {
  const {
    assignedProjectIds,
    isLoading,
    isSaving,
    toggleProjectSelection,
    saveAssignments,
  } = useProjectAssignmentEditor({
    open,
    userId: user?.id ?? null,
    onSaved: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Projects</DialogTitle>
          <div className="text-sm text-muted-foreground">
            Assigning projects for <span className="font-medium text-foreground">{user?.name}</span>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <Label className="mb-2 block">Select Projects</Label>
          <ScrollArea className="h-[300px] border rounded-md p-4">
            {isLoading ? (
              <div className="text-center py-4 text-sm text-muted-foreground">Loading...</div>
            ) : projects.length === 0 ? (
              <div className="text-center py-4 text-sm text-muted-foreground">No projects found.</div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="flex items-start space-x-3">
                    <Checkbox
                      id={`proj-${project.id}`}
                      checked={assignedProjectIds.includes(project.id)}
                      onCheckedChange={(checked) => 
                        toggleProjectSelection(project.id, checked as boolean)
                      }
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={`proj-${project.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {project.title}
                      </label>
                      {project.code && (
                        <p className="text-xs text-muted-foreground">{project.code}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={saveAssignments} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
