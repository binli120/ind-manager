"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/lib/store";
import {
  hydrateSelectedTeamFromStorage,
  setSelectedTeamId,
} from "@/lib/store/slices/teamsSlice";

/**
 * Source of truth for team selection:
 * - Hydrates Redux from localStorage on mount
 * - Persists via reducer (setSelectedTeamId) — Header never touches storage
 */
export function useTeam() {
  const dispatch = useDispatch<AppDispatch>();
  const { teams, currentTeam, selectedTeamId, isLoading, error } = useSelector(
    (s: RootState) => s.teams
  );

  // Hydrate once on mount
  useEffect(() => {
    dispatch(hydrateSelectedTeamFromStorage());
  }, [dispatch]);

  // Setter that also persists via reducer
  const setTeam = (id: string | null) => {
    dispatch(setSelectedTeamId(id));
  };

  return { teams, currentTeam, selectedTeamId, isLoading, error, setTeam };
}
