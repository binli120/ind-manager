// Author: Bin Lee
// Email: binlee120@gmail.com
import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { createBrowserClient } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { auth_text } from "@/utils/constants";
import {
  authProfileRowSchema,
  mapSupabaseUserToAuthUser,
  type AuthUser as User,
} from "@/lib/store/mappers/authUserMapper";

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

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "Unknown error"
}

// Async thunks for authentication
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const supabase = createBrowserClient();
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

        const user = mapSupabaseUserToAuthUser({
          authUser: data.user,
          profile: profile ? authProfileRowSchema.parse(profile) : null,
        });

        return { user, session: data.session };
      }

      throw new Error("No user data returned");
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error) || "Login failed");
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
      const supabase = createBrowserClient();
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

      if (error) throw error;

      return { user: data.user, session: data.session };
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error) || "Sign up failed");
    }
  },
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return true;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error) || "Logout failed");
    }
  },
);

export const getCurrentUser = createAsyncThunk(
  "auth/getCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const supabase = createBrowserClient();
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session?.user) return null;

      const user = session.user;
      {
        // Fetch additional user profile data
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          console.warn("Profile fetch error:", profileError);
        }

        const userData = mapSupabaseUserToAuthUser({
          authUser: user,
          profile: profile ? authProfileRowSchema.parse(profile) : null,
        });

        return { user: userData, session };
      }

      return null;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error) || "Failed to get current user");
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
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error) || "Profile update failed");
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
        state.session = action.payload.session;
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
      .addCase(signUpUser.fulfilled, (state) => {
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
        state.session = null;
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
        state.user = action.payload?.user ?? null;
        state.session = action.payload?.session ?? null;
        state.sessionToken = action.payload?.session?.access_token;
        state.isAuthenticated = !!action.payload?.user;
        state.error = null;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
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
export type { User };
export default authSlice.reducer;
