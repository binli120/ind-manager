// Author: Bin Lee
// Email: binlee120@gmail.com

"use client";

import { useAsyncTask } from "@/hooks/useAsyncTask";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export type TenantUserOption = {
  id: string;
  name: string;
  email: string;
};

export function useTenantUsers(tenantId: string | null | undefined) {
  const loadUsersTask = useAsyncTask(
    async (activeTenantId: string): Promise<TenantUserOption[]> => {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("users")
        .select("id,name,email")
        .eq("tenantid", activeTenantId)
        .order("name", { ascending: true });

      if (fetchError) {
        throw new Error(fetchError.message || "Failed to load tenant users");
      }

      return (data ?? []).map((row) => ({
        id: row.id,
        name: row.name || row.email,
        email: row.email,
      }));
    },
    [] as TenantUserOption[],
  );
  const { data, error, status, isLoading, reset, run } = loadUsersTask;

  useEffect(() => {
    if (!tenantId) {
      reset([]);
      return;
    }

    void run(tenantId);
  }, [reset, run, tenantId]);

  return {
    users: data,
    error,
    status,
    isLoading,
  };
}
