"use client";

import type React from "react";

import { useAppSelector, useAppDispatch } from "@/lib/store";
import { Team, fetchUserTeams } from "@/lib/store/slices/teamsSlice";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Users,
  Crown,
  UserCheck,
  Activity,
  Building2,
} from "lucide-react";
import { CreateTeamDialog } from "@/components/ui/teams/create-team-dialog";
import { TeamsOverviewTab } from "./ui/teams/teams-overview-tab";
import { ViewTeamDialog } from "./ui/teams/view-team-dialog";
import { TeamsTeamsTab } from "./ui/teams/teams-teams-tab";
import { EditTeamDialog } from "./ui/teams/edit-team-dialog";
import { AddMembersDialog } from "./ui/teams/add-members-dialog";
import { ManageRolesDialog } from "./ui/teams/manage-roles-dialog";
import { TeamsMembersTab } from "./ui/teams/teams-members-tab";
import { TeamsRolesTab } from "./ui/teams/teams-roles-tab";

interface TeamMetric {
  label: string;
  value: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function TeamsView() {
  const dispatch = useAppDispatch();
  const { teams, isLoading } = useAppSelector((state) => state.teams);
  const { user } = useAppSelector((state) => state.auth);

  // Dialog state
  const [showViewTeam, setShowViewTeam] = useState<boolean>(false);
  const [showEditTeam, setShowEditTeam] = useState<boolean>(false);
  const [showAddMembers, setShowAddMembers] = useState<boolean>(false);
  const [showManageRoles, setShowManageRoles] = useState<boolean>(false);

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchUserTeams(user.id));
    }
  }, [dispatch, user?.id]);

  // TODO: add functionality
  const handleUpdateTeam = (team: Team) => {
    setShowEditTeam(false);
    setSelectedTeamId(null);
  };

  // TODO: add functionality
  const handleDeleteTeam = (teamId: string) => {};

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
          <TeamsOverviewTab />
          <TeamsTeamsTab
            setSelectedTeamId={setSelectedTeamId}
            setShowAddMembers={setShowAddMembers}
            setShowManageRoles={setShowManageRoles}
            setShowViewTeam={setShowViewTeam}
            handleDeleteTeam={handleDeleteTeam}
            setShowEditTeam={setShowEditTeam}
          />
          <TeamsMembersTab
            setSelectedTeamId={setSelectedTeamId}
            setShowAddMembers={setShowAddMembers}
          />
          <TeamsRolesTab
            setSelectedTeamId={setSelectedTeamId}
            setShowManageRoles={setShowManageRoles}
          />
        </Tabs>
        <ViewTeamDialog
          showViewTeam={showViewTeam}
          setShowViewTeam={setShowViewTeam}
          setShowEditTeam={setShowEditTeam}
          selectedTeamId={selectedTeamId}
          setSelectedTeamId={setSelectedTeamId}
        />
        <EditTeamDialog
          showEditTeam={showEditTeam}
          setShowEditTeam={setShowEditTeam}
          handleUpdateTeam={handleUpdateTeam}
          selectedTeamId={selectedTeamId}
          setSelectedTeamId={setSelectedTeamId}
        />
        <AddMembersDialog
          selectedTeamId={selectedTeamId}
          setSelectedTeamId={setSelectedTeamId}
          showAddMembers={showAddMembers}
          setShowAddMembers={setShowAddMembers}
        />
        <ManageRolesDialog
          selectedTeamId={selectedTeamId}
          setSelectedTeamId={setSelectedTeamId}
          showManageRoles={showManageRoles}
          setShowManageRoles={setShowManageRoles}
        />
      </div>

      {/* Content */}
    </div>
  );
}
