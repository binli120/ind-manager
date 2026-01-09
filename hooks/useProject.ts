// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/lib/store";
import {
  hydrateSelectedProjectFromStorage,
  setSelectedProjectId,
} from "@/lib/store/slices/projectsSlice";


export function useProject() {
  const dispatch = useDispatch<AppDispatch>();
  const {
    projects,
    currentProject,
    selectedProjectId,
    isLoading,
    error,
  } = useSelector((s: RootState) => s.projects);

  // Hydrate once on mount
  useEffect(() => {
    dispatch(hydrateSelectedProjectFromStorage());
  }, [dispatch]);

  // Setter that also persists via reducer
  const setProject = (id: string | null) => {
    dispatch(setSelectedProjectId(id));
  };

  return {
    projects,
    currentProject,
    selectedProjectId,
    isLoading,
    error,
    setProject,
  };
}

