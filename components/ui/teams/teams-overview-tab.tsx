import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { Activity, Clock, Eye, Plus, Settings, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback } from "../avatar";
import { Badge } from "../badge";
import { Button } from "../button";
import { setCurrentTeam } from "@/lib/store/slices/teamsSlice";

export const TeamsOverviewTab: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isLoading, teams } = useAppSelector((state) => state.teams);

  const quickActions = [
    {
      icon: Plus,
      label: "Create New Team",
      description: "Set up a new team workspace",
      action: () => console.log("Create team"),
    },
    {
      icon: UserPlus,
      label: "Manage Members",
      description: "Add or remove team members",
      action: () => console.log("Manage members"),
    },
    {
      icon: Settings,
      label: "Manage Roles",
      description: "Configure team permissions",
      action: () => console.log("Manage roles"),
    },
  ];

  const recentActivity = teams.slice(0, 3).map((team) => ({
    id: team.id,
    teamName: team.name,
    teamInitial: team.name.charAt(0).toUpperCase(),
    memberCount: team.memberCount,
    lastUpdated: "Updated recently",
    type: "update" as const,
  }));

  return (
    <TabsContent value="overview" className="space-y-6">
      <div className="p-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading teams...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <Card className="border-border bg-card">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-card-foreground">
                        Recent Activity
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Latest team updates and changes
                      </p>
                    </div>
                    <Activity className="w-5 h-5 text-muted" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-accent/5 transition-colors"
                    >
                      <Avatar className="w-10 h-10 bg-accent/10">
                        <AvatarFallback className="text-accent font-semibold">
                          {activity.teamInitial}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-card-foreground truncate">
                            {activity.teamName}
                          </h4>
                          <Badge variant="secondary" className="text-xs">
                            {activity.memberCount} member
                            {activity.memberCount !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{activity.lastUpdated}</span>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-accent/10 hover:text-accent"
                        onClick={() =>
                          dispatch(
                            setCurrentTeam(
                              teams.find((t) => t.id === activity.id) || null,
                            ),
                          )
                        }
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  {recentActivity.length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Activity className="w-6 h-6 text-muted" />
                      </div>
                      <p className="text-muted-foreground">
                        No recent activity
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <Card className="border-border bg-card">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-card-foreground">
                        Quick Actions
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Common team management tasks
                      </p>
                    </div>
                    <Settings className="w-5 h-5 text-muted" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      onClick={action.action}
                      className="w-full justify-start h-auto p-4 hover:bg-accent/5 hover:text-accent"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <action.icon className="w-4 h-4 text-accent" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-card-foreground">
                            {action.label}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </TabsContent>
  );
};
