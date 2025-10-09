import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Crown } from "lucide-react";
import {
  Team,
  TeamMember,
  fetchTeamDetails,
  updateTeamMember,
} from "@/lib/store/slices/teamsSlice";
import { Label } from "../label";
import {
  canEditMember,
  canManageTeam,
  getRoleColor,
  getRoleIcon,
} from "./utils";

type ManageRolesDialogProps = {
  showManageRoles: boolean;
  setShowManageRoles: (value: boolean) => void;
  selectedTeamId: string | null;
  setSelectedTeamId: (teamId: string | null) => void;
};
export const ManageRolesDialog: React.FC<ManageRolesDialogProps> = ({
  showManageRoles,
  setShowManageRoles,
  selectedTeamId,
  setSelectedTeamId,
}) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((app) => app.auth);
  const { teams } = useAppSelector((app) => app.teams);

  const teamDetails = teams.find((t) => t.id === selectedTeamId);

  useEffect(() => {
    if (selectedTeamId) {
      dispatch(fetchTeamDetails(selectedTeamId));
    }
  }, [dispatch, selectedTeamId]);

  const onOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedTeamId(null);
    }
    setShowManageRoles(open);
  };

  const handleUpdateRole = (teamId: string, userId: string, role: string) => {
    dispatch(
      updateTeamMember({
        memberId: userId,
        teamId: teamId,
        updates: { role: role as TeamMember["role"] },
      }),
    );
  };

  if (teamDetails == null) return <></>;

  const canManage = canManageTeam(teamDetails, user);

  return (
    <Dialog open={showManageRoles} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {canManage ? "Manage Roles" : "Roles"} - {teamDetails.name}
          </DialogTitle>
          <DialogDescription>
            {canManage ? "Update" : "View"} member roles and permissions
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Team Members</Label>
            <div className="space-y-2">
              {teamDetails.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>
                        {member.name?.charAt(0) || member.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {member.name || member.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {member.id === teamDetails.ownerId ? (
                      <Badge variant="default">
                        <Crown className="h-3 w-3 mr-1" />
                        Owner
                      </Badge>
                    ) : canEditMember(teamDetails, member, user) ? (
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          handleUpdateRole(teamDetails.id, member.id, value)
                        }
                      >
                        <SelectTrigger className="h-8 w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        className={`${getRoleColor(member.role)} text-white text-xs`}
                      >
                        {getRoleIcon(member.role)}
                        {member.role}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowManageRoles(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
