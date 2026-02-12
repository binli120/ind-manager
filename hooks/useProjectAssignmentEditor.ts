// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import { useEffect, useState } from "react";
import {
  addUserToProject,
  fetchUserProjectIds,
  removeUserFromProject,
} from "@/lib/supabase/users";
import { diffProjectAssignments } from "@/lib/users/projectAssignmentModel";

export function useProjectAssignmentEditor({
  open,
  userId,
  onSaved,
}: {
  open: boolean;
  userId: string | null;
  onSaved: () => void;
}) {
  const [assignedProjectIds, setAssignedProjectIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open || !userId) {
      setAssignedProjectIds([]);
      return;
    }

    let isActive = true;

    const loadAssignments = async () => {
      setIsLoading(true);
      try {
        const ids = await fetchUserProjectIds(userId);
        if (!isActive) return;
        setAssignedProjectIds(ids);
      } catch (error) {
        console.error("Failed to load assignments", error);
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    void loadAssignments();

    return () => {
      isActive = false;
    };
  }, [open, userId]);

  const toggleProjectSelection = (projectId: string, checked: boolean) => {
    if (checked) {
      setAssignedProjectIds((prev) => [...prev, projectId]);
      return;
    }

    setAssignedProjectIds((prev) => prev.filter((id) => id !== projectId));
  };

  const saveAssignments = async () => {
    if (!userId) return;

    setIsSaving(true);
    try {
      const currentProjectIds = await fetchUserProjectIds(userId);
      const { toAdd, toRemove } = diffProjectAssignments({
        currentProjectIds,
        selectedProjectIds: assignedProjectIds,
      });

      await Promise.all([
        ...toAdd.map((projectId) => addUserToProject(userId, projectId)),
        ...toRemove.map((projectId) => removeUserFromProject(userId, projectId)),
      ]);

      onSaved();
    } catch (error) {
      console.error("Failed to save assignments", error);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    assignedProjectIds,
    isLoading,
    isSaving,
    toggleProjectSelection,
    saveAssignments,
  };
}
