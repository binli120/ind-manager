'use client';

import { ErrorNullable } from '@/lib/common/types';
import { getSupabaseEnv } from '@/lib/env';
import {
  clearAuth,
  setLoading as setAuthLoading,
  setSession as setAuthSession,
  setUser as setAuthUser,
} from '@/lib/store/slices/authSlice';
import { useAppDispatch } from '@/lib/store/store';
import { createBrowserClient } from '@supabase/ssr';
import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  updatePassword: (password: string) => Promise<{ error: ErrorNullable }>;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: ErrorNullable }>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: ErrorNullable }>;
  signOut: () => Promise<{ error: ErrorNullable }>;
  resetPassword: (email: string) => Promise<{ error: ErrorNullable }>;
  resendConfirmation: (email: string) => Promise<{ error?: ErrorNullable }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  const dispatch = useAppDispatch();

  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

  const signIn = async (email: string, password: string) => {
    dispatch(setAuthLoading(true));
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    dispatch(setAuthLoading(false));
    return { error };
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    setAuthLoading(false);
    return { error };
  };

  const signOut = async () => {
    dispatch(setAuthLoading(true));
    const { error } = await supabase.auth.signOut();
    dispatch(clearAuth());
    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}`,
    });
    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  };
  //DUMMY FUNCTION
  const resendConfirmation = async (_: string): Promise<{ error?: ErrorNullable }> => {
    // Implement the resend confirmation logic here
    try {
      // add dummy calls
      await supabase.auth.getUser();
      return {};
    } catch (error: unknown) {
      return { error: error as ErrorNullable };
    }
  };

  useEffect(() => {
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      dispatch(setAuthSession(session ?? null));
      dispatch(setAuthUser(session?.user ?? null));
      dispatch(setAuthLoading(false));
    };

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      dispatch(setAuthSession(session ?? null));
      dispatch(setAuthUser(session?.user ?? null));
      dispatch(setAuthLoading(false));

      if (event === 'TOKEN_REFRESHED') {
        // Token was refreshed successfully
      } else if (event === 'SIGNED_OUT') {
        // User signed out
      } else if (event === 'SIGNED_IN') {
        // User signed in successfully
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, dispatch]);

  const value = {
    user,
    setUser,
    updatePassword,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    resendConfirmation,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
