import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { createClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { auth_text } from "@/utils/constants";

export interface User {
  id: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
  role?: string | null;
  permissions?: string[] | null;
  createdAt: string;
  lastLoginAt?: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sessionToken?: string;
}

const initialState: AuthState = {
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks for authentication
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Fetch additional user profile data
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          console.warn("Profile fetch error:", profileError);
        }

        const user: User = {
          id: data.user.id,
          email: data.user.email!,
          name: profile?.name || data.user.user_metadata?.name,
          avatar: profile?.avatar_url,
          // role: profile?.role || "user",
          // permissions: profile?.permissions || [],
          // teamId: profile?.team_id,
          createdAt: data.user.created_at,
          lastLoginAt: data.user.last_sign_in_at,
        };

        return { user, session: data.session };
      }

      throw new Error("No user data returned");
    } catch (error: any) {
      return rejectWithValue(error.message || "Login failed");
    }
  },
);

export const signUpUser = createAsyncThunk(
  "auth/signUpUser",
  async (
    {
      email,
      password,
      name,
    }: { email: string; password: string; name?: string },
    { rejectWithValue },
  ) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            window.location.origin,
          data: {
            name: name || "",
          },
        },
      });

      //Email already registered
      if (error) {
        const msg = error.message?.toLowerCase() || "";
        if (msg.includes("already registered") || msg.includes("user already exists")) {
          return rejectWithValue(auth_text.email_registered);
        }
        return rejectWithValue(error.message || auth_text.sign_up_failed);
      }

      const identities = (data?.user as any)?.identities ?? [];
      if (Array.isArray(identities) && identities.length === 0) {
        return rejectWithValue(auth_text.email_registered);
      }

      if (error) throw error;

      return { user: data.user, session: data.session };
    } catch (error: any) {
      return rejectWithValue(error.message || "Sign up failed");
    }
  },
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || "Logout failed");
    }
  },
);

export const getCurrentUser = createAsyncThunk(
  "auth/getCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const supabase = createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) throw error;

      if (user) {
        // Fetch additional user profile data
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          console.warn("Profile fetch error:", profileError);
        }

        const userData: User = {
          id: user.id,
          email: user.email!,
          name: profile?.name || user.user_metadata?.name,
          avatar: profile?.avatar_url,
          // role: profile?.role || "user",
          // permissions: profile?.permissions || [],
          // teamId: profile?.team_id,
          createdAt: user.created_at,
          lastLoginAt: user.last_sign_in_at,
        };

        return userData;
      }

      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to get current user");
    }
  },
);

export const updateUserProfile = createAsyncThunk(
  "auth/updateUserProfile",
  async (updates: Partial<User>, { rejectWithValue, getState }) => {
    try {
      const supabase = createClient();
      const state = getState() as { auth: AuthState };
      const userId = state.auth.user?.id;

      if (!userId) throw new Error("No user logged in");

      const { data, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Profile update failed");
    }
  },
);

//Reducer Functions
const handleClearError = (state: AuthState) => {
  state.error = null;
};

const handleSetUser = (state: AuthState, action: PayloadAction<User | null>) => {
  state.user = action.payload;
  state.isAuthenticated = !!action.payload;
};

const handleSetSession = (state: AuthState, action: PayloadAction<Session | null>) => {
  state.session = action.payload;
};

const handleSetLoading = (state: AuthState, action: PayloadAction<boolean>) => {
  state.isLoading = action.payload;
};

const handleClearAuth = (state: AuthState) => {
  state.user = null;
  state.session = null;
  state.isAuthenticated = false;
  state.isLoading = false;
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: handleClearError,
    setUser: handleSetUser,
    setSession: handleSetSession,
    setLoading: handleSetLoading,
    clearAuth: handleClearAuth,
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.sessionToken = action.payload.session?.access_token;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
      })
      // Sign up
      .addCase(signUpUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signUpUser.fulfilled, (state, action) => {
        state.isLoading = false;
        // Don't set user as authenticated until email is confirmed
        state.error = null;
      })
      .addCase(signUpUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.sessionToken = undefined;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Get current user
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
      })
      // Update profile
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        if (state.user) {
          state.user = { ...state.user, ...action.payload };
        }
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setUser, setLoading, setSession, clearAuth } = authSlice.actions;
export default authSlice.reducer;
