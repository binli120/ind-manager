import { TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { Crown, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "../avatar";
import { Badge } from "../badge";
import { Button } from "../button";
import { canManageTeam, formatRole, getRoleColor, getRoleIcon } from "./utils";
import { Separator } from "@radix-ui/react-select";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "../select";
import { TeamMember, updateTeamMember } from "@/lib/store/slices/teamsSlice";

type TeamsRolesTabProps = {
  setSelectedTeamId: (teamId: string) => void;
  setShowManageRoles: (value: boolean) => void;
};

export const TeamsRolesTab: React.FC<TeamsRolesTabProps> = ({
  setShowManageRoles,
  setSelectedTeamId,
}) => {
  const dispatch = useAppDispatch();
  const { isLoading, teams } = useAppSelector((state) => state.teams);
  const { user } = useAppSelector((state) => state.auth);

  const handleUpdateRole = (teamId: string, memberId: string, role: string) => {
    dispatch(
      updateTeamMember({
        memberId,
        teamId,
        updates: { role: role as TeamMember["role"] },
      }),
    );
  };

  return (
    <TabsContent value="roles" className="space-y-6">
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>Role Management</CardTitle>
          <CardDescription>
            Manage roles and permissions for team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {teams.map((team) => {
              const canManage = canManageTeam(team, user);

              return (
                <div key={team.id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{team.name}</h3>
                      <Badge variant="outline">
                        {team.members.length} members
                      </Badge>
                      {team.ownerId === user?.id && (
                        <Badge variant="default">
                          <Crown className="h-3 w-3 mr-1" />
                          Owner
                        </Badge>
                      )}
                    </div>
                    {canManage && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTeamId(team.id);
                          setShowManageRoles(true);
                        }}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Manage Roles
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {team.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center space-x-3 p-3 border rounded-lg"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {member.name?.charAt(0) || member.email.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {member.name || member.email}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {member.email}
                          </p>
                          <div className="mt-2">
                            {canManage && member.id !== team.ownerId ? (
                              <Select
                                value={member.role || "member"}
                                onValueChange={(value) =>
                                  handleUpdateRole(team.id, member.id, value)
                                }
                              >
                                <SelectTrigger className="h-6 text-xs">
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
                                className={`${getRoleColor(member.role || "member")} text-white text-xs`}
                              >
                                {getRoleIcon(member.role || "member")}
                                {formatRole(member.role) || "Member"}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Separator />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
};
