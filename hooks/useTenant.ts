// Author: Bin Lee
// Email: binlee120@gmail.com

"use client";

import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  hydrateSelectedTenantFromStorage,
  setSelectedTenantId,
} from "@/lib/store/slices/tenantsSlice";

/**
 */
export function useTenant() {
  const dispatch = useAppDispatch();
  const { tenants, currentTenant, selectedTenantId, isLoading, error } =
    useAppSelector((s) => s.tenants);

  useEffect(() => {
    dispatch(hydrateSelectedTenantFromStorage());
  }, [dispatch]);

  const setTenant = useCallback((id: string | null) => {
    dispatch(setSelectedTenantId(id));
  }, [dispatch]);

  return { tenants, currentTenant, selectedTenantId, isLoading, error, setTenant };
}
