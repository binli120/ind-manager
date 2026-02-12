import type { ProjectMember } from "@/lib/projects/types";

export type ProjectMemberPayload = {
  id?: string;
  user_id?: string;
  project_id?: string;
  profiles?: { name?: string; avatar_url?: string };
  role?: ProjectMember["role"];
  created_at?: string;
};

export const mapProjectMemberPayloadToProjectMember = (
  payload: ProjectMemberPayload,
): ProjectMember | null => {
  if (!payload.id) return null;

  const name = payload.profiles?.name || "Unknown User";
  const initials =
    name
      .split(" ")
      .map((part) => part[0])
      .join("") || "U";

  return {
    id: payload.id,
    userId: payload.user_id ?? "",
    projectId: payload.project_id ?? "",
    name,
    avatar: payload.profiles?.avatar_url,
    initials,
    role: payload.role ?? "member",
    joinedAt: payload.created_at ?? new Date().toISOString(),
  };
};
