// Author: Bin Lee
// Email: binlee120@gmail.com

export const diffProjectAssignments = ({
  currentProjectIds,
  selectedProjectIds,
}: {
  currentProjectIds: string[];
  selectedProjectIds: string[];
}) => {
  const currentSet = new Set(currentProjectIds);
  const selectedSet = new Set(selectedProjectIds);

  const toAdd = selectedProjectIds.filter((id) => !currentSet.has(id));
  const toRemove = currentProjectIds.filter((id) => !selectedSet.has(id));

  return {
    toAdd,
    toRemove,
  };
};
