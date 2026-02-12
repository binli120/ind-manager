import type { User as SupabaseUser } from "@supabase/supabase-js";
import { z } from "zod";

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
  role?: string | null;
  privilege?: string | null;
  permissions?: string[] | null;
  createdAt: string;
  lastLoginAt?: string;
};

export type AuthProfileRow = {
  name?: string | null;
  avatar_url?: string | null;
  submission_role?: string | null;
};

export const authProfileRowSchema: z.ZodType<AuthProfileRow> = z.object({
  name: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  submission_role: z.string().nullable().optional(),
});

export const mapSupabaseUserToAuthUser = ({
  authUser,
  profile,
}: {
  authUser: SupabaseUser;
  profile?: AuthProfileRow | null;
}): AuthUser => ({
  id: authUser.id,
  email: authUser.email ?? "",
  name: profile?.name || (authUser.user_metadata?.name as string | undefined),
  avatar: profile?.avatar_url,
  privilege: (authUser.user_metadata?.privilege as string | undefined) ?? "user",
  role:
    profile?.submission_role ??
    (authUser.user_metadata?.role as string | undefined) ??
    null,
  createdAt: authUser.created_at,
  lastLoginAt: authUser.last_sign_in_at ?? undefined,
});
