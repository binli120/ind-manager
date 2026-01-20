"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/lib/store";
import {
  hydrateSelectedTenantFromStorage,
  setSelectedTenantId,
} from "@/lib/store/slices/tenantsSlice";

/**
 */
export function useTenant() {
  const dispatch = useDispatch<AppDispatch>();
  const { tenants, currentTenant, selectedTenantId, isLoading, error } =
    useSelector((s: RootState) => s.tenants);

  useEffect(() => {
    dispatch(hydrateSelectedTenantFromStorage());
  }, [dispatch]);

  const setTenant = (id: string | null) => {
    dispatch(setSelectedTenantId(id));
  };

  return { tenants, currentTenant, selectedTenantId, isLoading, error, setTenant };
}
