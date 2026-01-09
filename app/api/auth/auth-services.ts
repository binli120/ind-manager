'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Session } from '@supabase/supabase-js';
import { getSupabaseEnv } from '@/lib/env';

const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export const authServices = {
  async signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  },

  async signUp(email: string, password: string, metadata?: any) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    return { data, error };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}`,
    });
    return { error };
  },

  async updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  },

  async getSession(): Promise<{ session: Session | null }> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return { session: session ?? null };
  },

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return data.subscription;
  },

  // DUMMY RESEND IMPLEMENTATION
  async getUser() {
    return supabase.auth.getUser();
  },
};
