import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/schema";

type TenantRow = Database["public"]["Tables"]["tenants"]["Row"];

export type Tenant = {
  id: string;
  name: string;
  address: string | null;
  contactPerson: string | null;
  contactEmail: string | null;
  contactNumber: number | null;
  status: Database["public"]["Enums"]["tenant_status_type"];
  ownerUserId: string | null;
  metadata: TenantRow["metadata"];
  createdAt: string;
};

interface TenantsState {
  tenants: Tenant[];
  currentTenant: Tenant | null;
  isLoading: boolean;
  error: string | null;
  selectedTenantId: string | null;
}

const initialState: TenantsState = {
  tenants: [],
  currentTenant: null,
  isLoading: false,
  error: null,
  selectedTenantId: null,
};

const toTenant = (row: TenantRow): Tenant => ({
  id: row.id,
  name: row.name,
  address: row.address,
  contactPerson: row.contact_person,
  contactEmail: row.contact_email,
  contactNumber: row.contact_number,
  status: row.status,
  ownerUserId: row.owner_user_id,
  metadata: row.metadata,
  createdAt: row.created_at,
});

export const fetchUserTenants = createAsyncThunk<
  Tenant[],
  { userId: string },
  { rejectValue: string }
>("tenants/fetchUserTenants", async ({ userId }, { rejectWithValue }) => {
  const supabase = createClient();

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("tenantid")
    .eq("id", userId)
    .single();

  if (userError) return rejectWithValue(userError.message);
  if (!userRow?.tenantid) return [];

  const { data: tenants, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", userRow.tenantid);

  if (error) return rejectWithValue(error.message);

  return (tenants ?? []).map(toTenant);
});

export const fetchTenantDetails = createAsyncThunk<
  Tenant,
  { tenantId: string },
  { rejectValue: string }
>("tenants/fetchTenantDetails", async ({ tenantId }, { rejectWithValue }) => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", tenantId)
    .single();

  if (error) return rejectWithValue(error.message);
  return toTenant(data);
});

const tenantsSlice = createSlice({
  name: "tenants",
  initialState,
  reducers: {
    setCurrentTenant: (state, action: PayloadAction<Tenant | null>) => {
      state.currentTenant = action.payload;
      state.selectedTenantId = action.payload?.id ?? null;
    },
    setSelectedTenantId: (state, action: PayloadAction<string | null>) => {
      state.selectedTenantId = action.payload;
      state.currentTenant =
        state.tenants.find((t) => t.id === action.payload) ?? null;

      if (action.payload) {
        localStorage.setItem("selectedTenantId", action.payload);
      } else {
        localStorage.removeItem("selectedTenantId");
      }
    },
    hydrateSelectedTenantFromStorage: (state) => {
      const saved =
        typeof window !== "undefined"
          ? localStorage.getItem("selectedTenantId")
          : null;
      state.selectedTenantId = saved ?? null;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateTenantLocally: (
      state,
      action: PayloadAction<Partial<Tenant> & { id: string }>,
    ) => {
      const index = state.tenants.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state.tenants[index] = { ...state.tenants[index], ...action.payload };
      }
      if (state.currentTenant?.id === action.payload.id) {
        state.currentTenant = { ...state.currentTenant, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserTenants.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserTenants.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tenants = action.payload;

        if (state.selectedTenantId) {
          state.currentTenant =
            state.tenants.find((t) => t.id === state.selectedTenantId) ?? null;

          if (!state.currentTenant && state.tenants.length > 0) {
            state.currentTenant = state.tenants[0];
            state.selectedTenantId = state.tenants[0].id;
          }
        } else if (state.tenants.length > 0) {
          state.currentTenant = state.tenants[0];
          state.selectedTenantId = state.tenants[0].id;
        }
      })
      .addCase(fetchUserTenants.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          (typeof action.payload === "string" ? action.payload : null) ??
          action.error.message ??
          "Failed to fetch tenants";
      })
      .addCase(fetchTenantDetails.fulfilled, (state, action) => {
        state.currentTenant = action.payload;

        const index = state.tenants.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.tenants[index] = action.payload;
        } else {
          state.tenants.push(action.payload);
        }
      })
      .addCase(fetchTenantDetails.rejected, (state, action) => {
        state.error =
          (typeof action.payload === "string" ? action.payload : null) ??
          action.error.message ??
          "Failed to fetch tenant details";
      });
  },
});

export const {
  setCurrentTenant,
  setSelectedTenantId,
  hydrateSelectedTenantFromStorage,
  clearError,
  updateTenantLocally,
} = tenantsSlice.actions;

export default tenantsSlice.reducer;
