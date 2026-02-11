// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
'use client';

import { authServices } from '@/app/api/auth/auth-services';
import { ErrorNullable } from '@/lib/common/types';
import { useAppDispatch } from '@/lib/store';
import {
  clearAuth,
  setLoading as setAuthLoading,
  setSession as setAuthSession,
  setUser as setAuthUser,
  type User as AuthUser,
} from '@/lib/store/slices';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

interface AuthContextType {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  updatePassword: (password: string) => Promise<{ error: ErrorNullable }>;
  session: Session | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: ErrorNullable }>;
  signUp: (
    email: string,
    password: string,
    metadata?: Record<string, unknown>,
  ) => Promise<{ error: ErrorNullable }>;
  signOut: () => Promise<{ error: ErrorNullable }>;
  resetPassword: (email: string) => Promise<{ error: ErrorNullable }>;
  resendConfirmation: (email: string) => Promise<{ error?: ErrorNullable }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const toAuthUser = (user: SupabaseUser | null): AuthUser | null => {
  if (!user?.email) return null;

  const nameValue =
    typeof user.user_metadata?.name === 'string'
      ? user.user_metadata.name
      : null;
  const avatarValue =
    typeof user.user_metadata?.avatar_url === 'string'
      ? user.user_metadata.avatar_url
      : null;

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    name: nameValue,
    avatar: avatarValue,
    privilege:
      typeof user.user_metadata?.privilege === 'string'
        ? user.user_metadata.privilege
        : 'user',
    role:
      typeof user.user_metadata?.role === 'string'
        ? user.user_metadata.role
        : null,
    createdAt: user.created_at,
    lastLoginAt: user.last_sign_in_at ?? undefined,
  };
  return authUser;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useAppDispatch();

  const applyAuth = useCallback(
    (session: Session | null) => {
      setSession(session);
      setUser(toAuthUser(session?.user ?? null));
      setLoading(false);
      dispatch(setAuthSession(session ?? null));
      dispatch(setAuthUser(toAuthUser(session?.user ?? null)));
      dispatch(setAuthLoading(false));
    },
    [dispatch],
  );

  const signIn = async (email: string, password: string) => {
    dispatch(setAuthLoading(true));
    const { error } = await authServices.signIn(email, password);
    if (!error) {
      const { session } = await authServices.getSession();
      applyAuth(session);
      return { error: null };
    }
    dispatch(setAuthLoading(false));
    return { error };
  };

  const signUp = async (
    email: string,
    password: string,
    metadata?: Record<string, unknown>,
  ) => {
    dispatch(setAuthLoading(true));
    const { error } = await authServices.signUp(email, password, metadata);
    dispatch(setAuthLoading(false));
    return { error };
  };

  const signOut = async () => {
    dispatch(setAuthLoading(true));
    const { error } = await authServices.signOut();
    dispatch(clearAuth());
    dispatch(setAuthLoading(false));
    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await authServices.resetPassword(email);
    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await authServices.updatePassword(password);
    return { error };
  };

  // DUMMY FUNCTION
  const resendConfirmation = async (
    email: string,
  ): Promise<{ error?: ErrorNullable }> => {
    void email;
    try {
      await authServices.getUser();
      return {};
    } catch (error: unknown) {
      return { error: error as ErrorNullable };
    }
  };

  useEffect(() => {
    const getInitialSession = async () => {
      const { session } = await authServices.getSession();
      applyAuth(session);
    };

    getInitialSession();

    const subscription = authServices.onAuthStateChange((event, session) => {
      applyAuth(session);

      if (event === 'TOKEN_REFRESHED') {
        // Token was refreshed successfully
      } else if (event === 'SIGNED_OUT') {
        // User signed out
      } else if (event === 'SIGNED_IN') {
        // User signed in successfully
      }
    });

    return () => subscription.unsubscribe();
  }, [applyAuth]);

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
