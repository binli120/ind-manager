// Author: Bin Lee
// Email: binlee120@gmail.com
"use client";

import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  hydrateSelectedProjectFromStorage,
  setSelectedProjectId,
} from "@/lib/store/slices";


export function useProject() {
  const dispatch = useAppDispatch();
  const {
    projects,
    currentProject,
    selectedProjectId,
    isLoading,
    error,
  } = useAppSelector((s) => s.projects);

  // Hydrate once on mount
  useEffect(() => {
    dispatch(hydrateSelectedProjectFromStorage());
  }, [dispatch]);

  // Setter that also persists via reducer
  const setProject = useCallback((id: string | null) => {
    dispatch(setSelectedProjectId(id));
  }, [dispatch]);

  return {
    projects,
    currentProject,
    selectedProjectId,
    isLoading,
    error,
    setProject,
  };
}
