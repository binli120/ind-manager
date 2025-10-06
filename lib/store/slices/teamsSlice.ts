import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { createClient } from "@/lib/supabase/client";

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  name: string;
  email: string;
  avatar?: string;
  role: "owner" | "admin" | "member" | "viewer";
  permissions: string[];
  joinedAt: string;
  lastActive?: string;
  status: "active" | "inactive" | "pending";
}

export interface Team {
  id: string;
  name: string;
  description?: string | null;
  avatar?: string | null;
  ownerId: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
  settings: {
    isPublic: boolean;
    allowInvites: boolean;
    defaultRole: "member" | "viewer";
  };
  members: TeamMember[];
  projects?: string[]; // Project IDs
}

export interface TeamInvite {
  id: string;
  teamId: string;
  email: string;
  role: "admin" | "member" | "viewer";
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  status: "pending" | "accepted" | "declined" | "expired";
}

interface TeamsState {
  teams: Team[];
  currentTeam: Team | null;
  teamMembers: TeamMember[];
  teamInvites: TeamInvite[];
  isLoading: boolean;
  error: string | null;
  selectedTeamId: string | null;
}

const initialState: TeamsState = {
  teams: [],
  currentTeam: null,
  teamMembers: [],
  teamInvites: [],
  isLoading: false,
  error: null,
  selectedTeamId: null,
};

// Async thunks
export const fetchUserTeams = createAsyncThunk(
  "teams/fetchUserTeams",
  async (userId: string, { rejectWithValue }) => {
    try {
      const supabase = createClient();

      // Fetch teams where user is a member
      const { data: teamMembers, error: membersError } = await supabase
        .from("user_teams")
        .select(
          `
          *,
          teams (
            id,
            name:team_name,
            description,
            avatar:avatar_url,
            owner_id:team_creator_id,
            created_at,
            updated_at,
            settings:team_settings (
              isPublic:is_public,
              allowInvites:allow_invites,
              defaultRole:default_role
            )
          )
        `,
        )
        .eq("user_id", userId);

      if (membersError) throw membersError;

      // Transform data to match our interface
      const teams: Team[] =
        teamMembers?.map((member) => ({
          id: member.teams.id,
          name: member.teams.name,
          description: member.teams.description,
          avatar: member.teams.avatar,
          ownerId: member.teams.owner_id,
          memberCount: 0, // Will be populated separately
          createdAt: member.teams.created_at,
          updatedAt: member.teams.updated_at,
          settings: (member.teams.settings as Team["settings"]) || {
            isPublic: false,
            allowInvites: true,
            defaultRole: "member",
          },
          members: [],
        })) || [];

      // Fetch member counts for each team
      for (const team of teams) {
        const { count } = await supabase
          .from("user_teams")
          .select("*", { count: "exact", head: true })
          .eq("team_id", team.id)
          .eq("status", "active");

        team.memberCount = count || 0;
      }

      return teams;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch teams");
    }
  },
);

export const fetchTeamDetails = createAsyncThunk(
  "teams/fetchTeamDetails",
  async (teamId: string, { rejectWithValue }) => {
    try {
      const supabase = createClient();

      // Fetch team details
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .select(
          `
          *,
          settings:team_settings (
            isPublic:is_public,
            allowInvites:allow_invites,
            defaultRole:default_role
          )
        `,
        )
        .eq("id", teamId)
        .single();

      if (teamError) throw teamError;

      // Fetch team members
      const { data: members, error: membersError } = await supabase
        .from("teams")
        .select(
          `
          *,
          users (
            name,
            avatar_url
          )
        `,
        )
        .eq("team_id", teamId);

      if (membersError) throw membersError;

      const teamMembers: TeamMember[] =
        members?.map((member: any) => ({
          id: member.id,
          userId: member.user_id,
          teamId: member.team_id,
          name: member.profiles?.name || member.email,
          email: member.email,
          avatar: member.profiles?.avatar_url,
          role: member.role,
          permissions: member.permissions || [],
          joinedAt: member.created_at,
          lastActive: member.last_active,
          status: member.status,
        })) || [];

      const teamData: Team = {
        id: team.id,
        name: team.team_name,
        description: team.description ?? "",
        avatar: team.avatar_url,
        ownerId: team.team_creator_id,
        memberCount: teamMembers.length,
        createdAt: team.created_at,
        updatedAt: team.updated_at,
        settings: (team.settings as Team["settings"]) || {
          isPublic: false,
          allowInvites: true,
          defaultRole: "member",
        },
        members: teamMembers,
      };

      return { team: teamData, members: teamMembers };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch team details");
    }
  },
);

export const createTeam = createAsyncThunk(
  "teams/createTeam",
  async (
    { name, description }: { name: string; description?: string },
    { rejectWithValue, getState },
  ) => {
    try {
      const supabase = createClient();
      const state = getState() as { auth: { user: { id: string } | null } };
      const userId = state.auth.user?.id;

      if (!userId) throw new Error("User not authenticated");

      // Create team
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert({
          team_name: name,
          description,
          team_creator_id: userId,
          // settings: {
          //   isPublic: false,
          //   allowInvites: true,
          //   defaultRole: "member",
          // },
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add creator as owner
      const { error: memberError } = await supabase.from("user_teams").insert({
        team_id: team.id,
        user_id: userId,
        role: "owner",
        // status: "active",
        // permissions: ["all"],
      });

      if (memberError) throw memberError;

      return team;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create team");
    }
  },
);

export const inviteTeamMember = createAsyncThunk(
  "teams/inviteTeamMember",
  async (
    {
      teamId,
      email,
      role,
    }: { teamId: string; email: string; role: "admin" | "member" | "viewer" },
    { rejectWithValue, getState },
  ) => {
    try {
      const supabase = createClient();
      const state = getState() as { auth: { user: { id: string } | null } };
      const userId = state.auth.user?.id;

      if (!userId) throw new Error("User not authenticated");

      // Create invitation
      const { data: invite, error } = await supabase
        .from("team_invites")
        .insert({
          team_id: teamId,
          email,
          role,
          invited_by: userId,
          expires_at: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ).toISOString(), // 7 days
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      return invite;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to invite team member");
    }
  },
);

export const updateTeamMember = createAsyncThunk(
  "teams/updateTeamMember",
  async (
    { memberId, updates }: { memberId: string; updates: Partial<TeamMember> },
    { rejectWithValue },
  ) => {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("user_teams")
        .update(updates)
        .eq("id", memberId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update team member");
    }
  },
);

export const removeTeamMember = createAsyncThunk(
  "teams/removeTeamMember",
  async (memberId: string, { rejectWithValue }) => {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("user_teams")
        .delete()
        .eq("user_id", memberId);

      if (error) throw error;

      return memberId;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to remove team member");
    }
  },
);

const teamsSlice = createSlice({
  name: "teams",
  initialState,
  reducers: {
    setCurrentTeam: (state, action: PayloadAction<Team | null>) => {
      state.currentTeam = action.payload;
      state.selectedTeamId = action.payload?.id || null;
    },
    setSelectedTeamId: (state, action: PayloadAction<string | null>) => {
      state.selectedTeamId = action.payload;
      state.currentTeam =
        state.teams.find((team) => team.id === action.payload) || null;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateTeamLocally: (
      state,
      action: PayloadAction<Partial<Team> & { id: string }>,
    ) => {
      const index = state.teams.findIndex(
        (team) => team.id === action.payload.id,
      );
      if (index !== -1) {
        state.teams[index] = { ...state.teams[index], ...action.payload };
      }
      if (state.currentTeam?.id === action.payload.id) {
        state.currentTeam = { ...state.currentTeam, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user teams
      .addCase(fetchUserTeams.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserTeams.fulfilled, (state, action) => {
        state.isLoading = false;
        state.teams = action.payload;
        // Set first team as current if none selected
        if (!state.selectedTeamId && action.payload.length > 0) {
          state.currentTeam = action.payload[0];
          state.selectedTeamId = action.payload[0].id;
        }
      })
      .addCase(fetchUserTeams.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch team details
      .addCase(fetchTeamDetails.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTeamDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentTeam = action.payload.team;
        state.teamMembers = action.payload.members;

        // Update team in teams array
        const index = state.teams.findIndex(
          (team) => team.id === action.payload.team.id,
        );
        if (index !== -1) {
          state.teams[index] = action.payload.team;
        }
      })
      .addCase(fetchTeamDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create team
      .addCase(createTeam.fulfilled, (state, action) => {
        const newTeam: Team = {
          ...action.payload,
          memberCount: 1,
          members: [],
        };
        state.teams.push(newTeam);
        state.currentTeam = newTeam;
        state.selectedTeamId = newTeam.id;
      })
      .addCase(createTeam.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Invite team member
      .addCase(inviteTeamMember.fulfilled, (state, action) => {
        const invite: TeamInvite = {
          id: action.payload.id,
          teamId: action.payload.team_id,
          email: action.payload.email,
          role: action.payload.role,
          invitedBy: action.payload.invited_by,
          invitedAt: action.payload.created_at,
          expiresAt: action.payload.expires_at,
          status: action.payload.status,
        };
        state.teamInvites.push(invite);
      })
      .addCase(inviteTeamMember.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Update team member
      .addCase(updateTeamMember.fulfilled, (state, action) => {
        const index = state.teamMembers.findIndex(
          (member) => member.id === action.payload.id,
        );
        if (index !== -1) {
          state.teamMembers[index] = {
            ...state.teamMembers[index],
            ...action.payload,
          };
        }
      })
      // Remove team member
      .addCase(removeTeamMember.fulfilled, (state, action) => {
        state.teamMembers = state.teamMembers.filter(
          (member) => member.id !== action.payload,
        );
        if (state.currentTeam) {
          state.currentTeam.memberCount = Math.max(
            0,
            state.currentTeam.memberCount - 1,
          );
        }
      });
  },
});

export const {
  setCurrentTeam,
  setSelectedTeamId,
  clearError,
  updateTeamLocally,
} = teamsSlice.actions;
export default teamsSlice.reducer;
