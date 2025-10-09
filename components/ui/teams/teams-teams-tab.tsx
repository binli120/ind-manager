import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppSelector } from "@/lib/store";
import {
  Crown,
  Edit3,
  Eye,
  Search,
  Settings,
  Trash2,
  UserPlus,
} from "lucide-react";
import { Avatar, AvatarFallback } from "../avatar";
import { Badge } from "../badge";
import { Button } from "../button";
import {
  Select,
  SelectValue,
  SelectItem,
  SelectContent,
  SelectTrigger,
} from "../select";
import { Input } from "../input";
import { Label } from "../label";
import { useState } from "react";
import {
  canManageTeam,
  formatRole,
  getRoleColor,
  getRoleIcon,
} from "@/components/ui/teams/utils";
import { Team } from "@/lib/store/slices/teamsSlice";

type TeamsTeamsTabProps = {
  setSelectedTeamId: (teamId: string) => void;
  setShowViewTeam: (value: boolean) => void;
  setShowAddMembers: (value: boolean) => void;
  setShowManageRoles: (value: boolean) => void;
  setShowEditTeam: (value: boolean) => void;
  handleDeleteTeam: (teamId: string) => void;
};

export const TeamsTeamsTab: React.FC<TeamsTeamsTabProps> = ({
  setSelectedTeamId,
  setShowViewTeam,
  setShowAddMembers,
  setShowManageRoles,
  setShowEditTeam,
  handleDeleteTeam,
}) => {
  const { isLoading, teams } = useAppSelector((state) => state.teams);
  const { user } = useAppSelector((state) => state.auth);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredTeams = teams.filter((team) => {
    const matchesSearch =
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.members.some(
        (member) =>
          member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.email.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "owned" && team.ownerId === user?.id) ||
      (filterStatus === "member" && team.ownerId !== user?.id);
    return matchesSearch && matchesFilter;
  });

  return (
    <TabsContent value="teams" className="space-y-6">
      <div>
        <div className="flex items-center space-x-4 my-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search teams and members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border shadow-sm hover:shadow-md transition-shadow"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px] border shadow-sm hover:shadow-md transition-shadow">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              <SelectItem value="owned">Teams I Own</SelectItem>
              <SelectItem value="member">Teams I'm In</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTeams.map((team) => {
            const isOwner = team.ownerId === user?.id;
            const canManage = canManageTeam(team, user);

            return (
              <Card
                key={team.id}
                className="border shadow-sm hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{team.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{team.name}</CardTitle>
                        <div className="flex items-center space-x-2">
                          {isOwner ? (
                            <Badge variant="default" className="text-xs">
                              <Crown className="h-3 w-3 mr-1" />
                              Owner
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Member
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {team.memberCount} members
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedTeamId(team.id);
                          setShowViewTeam(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canManage && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedTeamId(team.id);
                              setShowEditTeam(true);
                            }}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (
                                confirm(
                                  "Are you sure you want to delete this team? This action cannot be undone.",
                                )
                              ) {
                                handleDeleteTeam(team.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Members</Label>
                    <div className="mt-2 space-y-2">
                      {team.members.slice(0, 3).map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>
                                {member.name?.charAt(0) ||
                                  member.email.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {member.name || member.email}
                              </p>
                              <Badge
                                className={`${getRoleColor(member.role || "member")} text-white text-xs`}
                              >
                                {getRoleIcon(member.role || "member")}
                                {formatRole(member.role) || "Member"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                      {team.memberCount > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{team.memberCount - 3} more members
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedTeamId(team.id);
                        setShowAddMembers(true);
                      }}
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Add Member
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedTeamId(team.id);
                        setShowManageRoles(true);
                      }}
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Roles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </TabsContent>
  );
};
