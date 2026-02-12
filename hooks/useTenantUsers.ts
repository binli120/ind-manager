// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type TenantUserOption = {
  id: string;
  name: string;
  email: string;
};

export function useTenantUsers(tenantId: string | null | undefined) {
  const [users, setUsers] = useState<TenantUserOption[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    if (!tenantId) {
      setUsers([]);
      setError(null);
      return () => {
        isActive = false;
      };
    }

    const supabase = createClient();
    const loadUsers = async () => {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("users")
        .select("id,name,email")
        .eq("tenantid", tenantId)
        .order("name", { ascending: true });

      if (!isActive) return;
      if (fetchError) {
        setError(fetchError.message || "Failed to load tenant users");
        setUsers([]);
        return;
      }

      setUsers(
        (data ?? []).map((row) => ({
          id: row.id,
          name: row.name || row.email,
          email: row.email,
        })),
      );
    };

    void loadUsers();

    return () => {
      isActive = false;
    };
  }, [tenantId]);

  return {
    users,
    error,
  };
}
