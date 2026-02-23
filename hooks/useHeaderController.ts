// Author: Bin Lee
// Email: binlee120@gmail.com

import { useEffect, useMemo } from "react";

import { useProject } from "@/hooks/useProject";
import { useTenant } from "@/hooks/useTenant";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchUserDocuments } from "@/lib/store/slices/documentsSlice";
import { fetchProjectDetails, fetchProjects } from "@/lib/store/slices/projectsSlice";
import { fetchUserTenants } from "@/lib/store/slices/tenantsSlice";
import {
  getBreadcrumbText,
  getEffectiveProjects,
  resolveProjectSelection,
  resolveTenantSelection,
  type HeaderView,
} from "@/lib/header/headerViewModel";

export function useHeaderController(currentView: HeaderView) {
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector((state) => state.auth);
  const { projects, selectedProjectId, setProject } = useProject();
  const { tenants, selectedTenantId, setTenant } = useTenant();

  const effectiveProjects = useMemo(
    () => getEffectiveProjects({ projects, selectedTenantId }),
    [projects, selectedTenantId],
  );

  useEffect(() => {
    if (!user?.id) return;
    void dispatch(fetchUserTenants({ userId: user.id }));
  }, [dispatch, user?.id]);

  useEffect(() => {
    const resolvedTenantId = resolveTenantSelection({
      tenants,
      selectedTenantId,
    });
    if (!resolvedTenantId || resolvedTenantId === selectedTenantId) return;
    setTenant(resolvedTenantId);
  }, [tenants, selectedTenantId, setTenant]);

  useEffect(() => {
    if (!user?.id) return;
    void dispatch(fetchProjects({ userId: user.id }));
  }, [dispatch, user?.id]);

  useEffect(() => {
    const resolvedProjectId = resolveProjectSelection({
      projects: effectiveProjects,
      selectedProjectId,
    });
    if (!resolvedProjectId || resolvedProjectId === selectedProjectId) return;
    setProject(resolvedProjectId);
  }, [effectiveProjects, selectedProjectId, setProject]);

  useEffect(() => {
    if (!selectedProjectId) return;

    void dispatch(fetchProjectDetails(selectedProjectId));
    if (user?.id) {
      void dispatch(fetchUserDocuments(user.id));
    }
  }, [dispatch, selectedProjectId, user?.id]);

  return {
    user,
    isLoading,
    tenants,
    selectedTenantId,
    setTenant,
    effectiveProjects,
    selectedProjectId,
    setProject,
    breadcrumbText: getBreadcrumbText(currentView),
  };
}
