// Author: Bin Lee
// Email: binlee120@gmail.com

import type { User } from "@/lib/store/slices";
import { isAdminEmail } from "@/lib/utils";

export type AccessDecision = {
  allowed: boolean;
  redirectTo?: string;
  reason?: string;
};

const adminPrivileges = [
  "system_admin",
  "user_manager",
  "admin",
  "system_administrator",
] as const;
const projectRoles = [
  "project_owner",
  "project_lead",
  "project_manager",
  "project_admin",
] as const;

const adminPaths = [/^\/admin(\/|$)/, /^\/design(\/|$)/];
const projectPaths = [
  /^\/projects(\/|$)/,
  /^\/workspace(\/|$)/,
  /^\/submission(\/|$)/,
  /^\/analysis(\/|$)/,
];

const isAdmin = (
  privilege?: string | null,
  role?: string | null,
  email?: string | null,
) =>
  (privilege != null &&
    adminPrivileges.includes(privilege as (typeof adminPrivileges)[number])) ||
  (role != null &&
    adminPrivileges.includes(role as (typeof adminPrivileges)[number])) ||
  isAdminEmail(email);

const hasProjectAccess = (user?: User | null) => {
  if (!user) return false;
  if (isAdmin(user.privilege, user.role, user.email)) return true;
  if (
    user.role &&
    projectRoles.includes(user.role as (typeof projectRoles)[number])
  ) return true;
  return false;
};

export function canAccessPath(
  pathname: string | null,
  user: User | null,
  isAuthenticated: boolean,
): AccessDecision {
  const path = pathname ?? "/";

  if (path.startsWith("/api/")) {
    return { allowed: true };
  }

  const authPage = path.startsWith("/auth/") || path === "/login";
  const resetPage = path.startsWith("/auth/reset-password");
  const baseRedirect = "/workspace/ind_editor";

  if (!isAuthenticated || !user) {
    // Allow unauthenticated users on auth pages
    if (authPage) return { allowed: true };
    return {
      allowed: false,
      redirectTo: "/auth/login",
      reason: "unauthenticated",
    };
  }

  // Authenticated user on auth page -> send to workspace
  if (authPage && !resetPage) {
    return {
      allowed: false,
      redirectTo: baseRedirect,
      reason: "already_authenticated",
    };
  }

  if (adminPaths.some((regex) => regex.test(path))) {
    if (isAdmin(user.privilege, user.role, user.email)) return { allowed: true };
    return { allowed: false, redirectTo: baseRedirect, reason: "admin_only" };
  }

  if (projectPaths.some((regex) => regex.test(path))) {
    if (hasProjectAccess(user)) return { allowed: true };
    return {
      allowed: false,
      redirectTo: baseRedirect,
      reason: "project_role_required",
    };
  }

  // Default: allow authenticated
  return { allowed: true };
}
