"use client";

import type React from "react";

import { useAppSelector, useAppDispatch } from "@/lib/store";
import { fetchUserTeams, setCurrentTeam } from "@/lib/store/slices/teamsSlice";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Users,
  Crown,
  UserCheck,
  Activity,
  Eye,
  UserPlus,
  Settings,
  Building2,
  Clock,
} from "lucide-react";
import { CreateTeamDialog } from "@/components/ui/teams/create-team-dialog";

interface TeamMetric {
  label: string;
  value: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

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

export function TeamsView() {
  const dispatch = useAppDispatch();
  const { teams, isLoading } = useAppSelector((state) => state.teams);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchUserTeams(user.id));
    }
  }, [dispatch, user?.id]);

  const teamMetrics: TeamMetric[] = [
    {
      label: "Total Teams",
      value: teams.length,
      description: "Active teams",
      icon: Building2,
    },
    {
      label: "Teams Owned",
      value: teams.filter((team) => team.ownerId === user?.id).length,
      description: "Teams you own",
      icon: Crown,
    },
    {
      label: "Team Member",
      value: teams.filter((team) => team.ownerId !== user?.id).length,
      description: "Teams you're in",
      icon: UserCheck,
    },
    {
      label: "Total Members",
      value: teams.reduce((total, team) => total + team.memberCount, 0),
      description: "Across all teams",
      icon: Users,
    },
    {
      label: "Active Teams",
      value: teams.filter((team) => team.memberCount > 1).length,
      description: "With multiple members",
      icon: Activity,
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
    <div className="flex-1 overflow-y-auto bg-gray-50/50">
      {/* Header */}
      <div className="bg-background border-b border-border px-8 py-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Team Management
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage your teams, members, and roles
            </p>
          </div>
          <CreateTeamDialog>
            <Button className="bg-purple-600 text-white hover:bg-purple-700 shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Create Team
            </Button>
          </CreateTeamDialog>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {teamMetrics.map((metric) => (
            <Card
              key={metric.label}
              className="border-border bg-card hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <metric.icon className="w-5 h-5 text-muted" />
                  <Badge variant="outline" className="text-xs">
                    {metric.description}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-card-foreground">
                    {metric.value}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {metric.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Navigation Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-96">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
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
    </div>
  );
}
