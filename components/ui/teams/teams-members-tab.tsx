import { TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { Crown, UserPlus, UserX } from "lucide-react";
import { Avatar, AvatarFallback } from "../avatar";
import { Badge } from "../badge";
import { Button } from "../button";
import {
  canEditMember,
  canManageTeam,
  getRoleColor,
  getRoleIcon,
} from "./utils";
import { Separator } from "@radix-ui/react-select";

type TeamsMembersTabProps = {
  setSelectedTeamId: (teamId: string) => void;
  setShowAddMembers: (value: boolean) => void;
};

export const TeamsMembersTab: React.FC<TeamsMembersTabProps> = ({
  setShowAddMembers,
  setSelectedTeamId,
}) => {
  const { isLoading, teams } = useAppSelector((state) => state.teams);
  const { user } = useAppSelector((state) => state.auth);

  // TODO: Add functionality
  const handleRemoveMember = (teamId: string, memberId: string) => {};

  return (
    <TabsContent value="members" className="space-y-6">
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>All Team Members</CardTitle>
          <CardDescription>
            View and manage all members across your teams
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {teams.map((team) => (
              <div key={team.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium">{team.name}</h3>
                    <Badge variant="outline">{team.memberCount} members</Badge>
                    {team.ownerId === user?.id && (
                      <Badge variant="default">
                        <Crown className="h-3 w-3 mr-1" />
                        Owner
                      </Badge>
                    )}
                  </div>
                  {canManageTeam(team, user) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedTeamId(team.id);
                        setShowAddMembers(true);
                      }}
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Add Member
                    </Button>
                  )}
                </div>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {team.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
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
                        <div className="flex items-center space-x-1 mt-1">
                          <Badge
                            className={`${getRoleColor(member.role || "member")} text-white text-xs`}
                          >
                            {getRoleIcon(member.role || "member")}
                            {member.role || "member"}
                          </Badge>
                          {member.id === team.ownerId && (
                            <Badge variant="default" className="text-xs">
                              <Crown className="h-3 w-3 mr-1" />
                              Owner
                            </Badge>
                          )}
                        </div>
                      </div>
                      {canEditMember(team, member, user) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveMember(team.id, member.id)}
                        >
                          <UserX className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Separator />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
};
