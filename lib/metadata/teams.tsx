import { User } from "@/lib/store/slices/authSlice";
import { Team, TeamMember } from "@/lib/store/slices/teamsSlice";
import { Crown, Shield, UserCheck, Users } from "lucide-react";

export const getRoleColor = (role: string) => {
  switch (role.toLowerCase()) {
    case "owner":
      return "bg-purple-600";
    case "admin":
      return "bg-blue-600";
    case "member":
      return "bg-green-600";
    default:
      return "bg-gray-600";
  }
};

export const getRoleIcon = (role: string) => {
  switch (role.toLowerCase()) {
    case "owner":
      return <Crown className="h-3 w-3" />;
    case "admin":
      return <Shield className="h-3 w-3" />;
    case "member":
      return <UserCheck className="h-3 w-3" />;
    default:
      return <Users className="h-3 w-3" />;
  }
};

export const formatRole = (role: string | null | undefined) => {
  if (role == null || role.length < 2) return "";
  return role.charAt(0).toUpperCase() + role.slice(1);
};

export const canManageTeam = (team: Team, user: User | null) => {
  return (
    team.ownerId === user?.id ||
    team.members.find((m) => m.id === user?.id)?.role === "admin"
  );
};

export const canEditMember = (
  team: Team,
  member: TeamMember,
  user: User | null,
) => {
  if (team.ownerId === member.id) return false;
  if (team.ownerId === user?.id) return true;
  if (member.id === user?.id) return false;
  const currentUserRole = team.members.find((m) => m.id === user?.id)?.role;
  return currentUserRole === "admin" && member.role !== "owner";
};
