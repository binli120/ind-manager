// Author: Bin Lee
// Email: binlee120@gmail.com

import { useEffect } from "react";
import {
  addUserToProject,
  fetchUserProjectIds,
  removeUserFromProject,
} from "@/lib/supabase/users";
import { diffProjectAssignments } from "@/lib/users/projectAssignmentModel";
import { useAsyncTask } from "@/hooks/useAsyncTask";

export function useProjectAssignmentEditor({
  open,
  userId,
  onSaved,
}: {
  open: boolean;
  userId: string | null;
  onSaved: () => void;
}) {
  const loadAssignmentsTask = useAsyncTask(
    async (targetUserId: string) => fetchUserProjectIds(targetUserId),
    [] as string[],
  );
  const saveAssignmentsTask = useAsyncTask(
    async ({ targetUserId, selectedProjectIds }: { targetUserId: string; selectedProjectIds: string[] }) => {
      const currentProjectIds = await fetchUserProjectIds(targetUserId);
      const { toAdd, toRemove } = diffProjectAssignments({
        currentProjectIds,
        selectedProjectIds,
      });

      await Promise.all([
        ...toAdd.map((projectId) => addUserToProject(targetUserId, projectId)),
        ...toRemove.map((projectId) => removeUserFromProject(targetUserId, projectId)),
      ]);
    },
    undefined,
  );
  const {
    data: assignedProjectIds,
    error: loadError,
    status: loadStatus,
    isLoading,
    reset: resetAssignments,
    run: loadAssignments,
    setData: setAssignedProjectIds,
  } = loadAssignmentsTask;
  const {
    error: saveError,
    status: saveStatus,
    isLoading: isSaving,
    run: runSaveAssignments,
  } = saveAssignmentsTask;

  useEffect(() => {
    if (!open || !userId) {
      resetAssignments([]);
      return;
    }

    void loadAssignments(userId);
  }, [resetAssignments, loadAssignments, open, userId]);

  const toggleProjectSelection = (projectId: string, checked: boolean) => {
    if (checked) {
      setAssignedProjectIds((prev) =>
        prev.includes(projectId) ? prev : [...prev, projectId],
      );
      return;
    }

    setAssignedProjectIds((prev) => prev.filter((id) => id !== projectId));
  };

  const saveAssignments = async () => {
    if (!userId) return;

    const result = await runSaveAssignments({
      targetUserId: userId,
      selectedProjectIds: assignedProjectIds,
    });
    if (!result.error) {
      onSaved();
    }
  };

  return {
    assignedProjectIds,
    isLoading,
    isSaving,
    loadError,
    saveError,
    status: {
      load: loadStatus,
      save: saveStatus,
    },
    toggleProjectSelection,
    saveAssignments,
  };
}
