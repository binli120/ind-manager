import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { createClient } from "@/lib/supabase/client";

export interface TeamMember {
  // TODO: Is id separate from userId?
  id: string;
  userId: string;
  teamId: string;
  name: string;
  email: string;
  avatar?: string | null;
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
      // NOTE: Currently querying all member info since current UI shows
      // list of members and roles in teams, members, & roles tab
      const { data: teamData, error: membersError } = await supabase
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
            ),
            memberCount:user_teams(count),
            members:user_teams(
              users (
                id,
                name,
                email,
                avatar_url
              ),
              role,
              joined_at
            )
          )
        `,
        )
        .eq("user_id", userId);

      if (membersError) throw membersError;

      // Transform data to match our interface
      const teams: Team[] =
        teamData?.map((team) => ({
          id: team.teams.id,
          name: team.teams.name,
          description: team.teams.description,
          avatar: team.teams.avatar,
          ownerId: team.teams.owner_id,
          memberCount: team.teams.memberCount?.[0].count ?? 0,
          createdAt: team.teams.created_at,
          updatedAt: team.teams.updated_at,
          settings: (team.teams.settings as Team["settings"]) || {
            isPublic: false,
            allowInvites: true,
            defaultRole: "member",
          },
          members: team.teams.members.map((m) => ({
            id: m.users.id,
            email: m.users.email,
            name: m.users?.name || m.users.email,
            userId: m.users.id,
            teamId: team.teams.id,
            role: m.role as TeamMember["role"],
            joinedAt: m.joined_at,
            // TODO: Add these fields to db?
            status: "active",
            permissions: [],
            lastActive: "",
          })),
        })) || [];

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
          ),
          members:user_teams (
            users (
              id,
              name,
              email,
              avatar_url
            ),
            role,
            joined_at
          ),
          memberCount:user_teams(count)
        `,
        )
        .eq("id", teamId)
        .single();

      if (teamError) throw teamError;

      const teamData: Team = {
        id: team.id,
        name: team.team_name,
        description: team.description ?? "",
        avatar: team.avatar_url,
        ownerId: team.team_creator_id,
        memberCount: team.memberCount?.[0].count,
        createdAt: team.created_at,
        updatedAt: team.updated_at,
        settings: (team.settings as Team["settings"]) || {
          isPublic: false,
          allowInvites: true,
          defaultRole: "member",
        },
        members: team.members.map((member) => ({
          id: member.users.id,
          userId: member.users.id,
          teamId: team.id,
          name: member.users?.name || member.users.email,
          email: member.users.email,
          avatar: member.users?.avatar_url,
          role: member.role as TeamMember["role"],
          joinedAt: member.joined_at,
          // TODO: Add these fields to db?
          permissions: [],
          lastActive: "",
          status: "active",
        })),
      };

      return { team: teamData, members: teamData.members };
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
        })
        .select()
        .single();

      if (teamError) throw teamError;

      const { data: settingsData, error: settingsError } = await supabase
        .from("team_settings")
        .insert({
          team_id: team.id,
          is_public: false,
          allow_invites: true,
          default_role: "member",
        })
        .select()
        .single();

      if (settingsError) throw teamError;

      // Add creator as owner
      const { data: memberData, error: memberError } = await supabase
        .from("user_teams")
        .insert({
          team_id: team.id,
          user_id: userId,
          role: "owner",
          // status: "active",
          // permissions: ["all"],
        })
        .select();

      if (memberError) throw memberError;

      return { team, settings: settingsData, members: memberData };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create team");
    }
  },
);

export const updateTeam = createAsyncThunk(
  "teams/updateTeam",
  async (
    {
      teamId,
      updates: { name, description },
    }: {
      teamId: string;
      updates: { name: string; description?: string | null };
    },
    { rejectWithValue, getState },
  ) => {
    try {
      const supabase = createClient();
      const state = getState() as { auth: { user: { id: string } | null } };
      const userId = state.auth.user?.id;

      if (!userId) throw new Error("User not authenticated");

      // Update team
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .update({
          team_name: name,
          description,
        })
        .eq("id", teamId)
        .select()
        .single();

      if (teamError) throw teamError;

      return { team };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update team");
    }
  },
);

export const deleteTeam = createAsyncThunk(
  "teams/deleteTeam",
  async ({ teamId }: { teamId: string }, { rejectWithValue, getState }) => {
    try {
      const supabase = createClient();
      const state = getState() as { auth: { user: { id: string } | null } };
      const userId = state.auth.user?.id;

      if (!userId) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("teams")
        .delete()
        .eq("id", teamId)
        .eq("team_creator_id", userId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete team");
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
      console.log("team", teamId);

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
    {
      memberId,
      teamId,
      updates,
    }: { memberId: string; teamId: string; updates: Partial<TeamMember> },
    { rejectWithValue },
  ) => {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("user_teams")
        .update(updates)
        .eq("user_id", memberId)
        .eq("team_id", teamId)
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
  async (
    { memberId, teamId }: { memberId: string; teamId: string },
    { rejectWithValue },
  ) => {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("user_teams")
        .delete()
        .eq("user_id", memberId)
        .eq("team_id", teamId)
        .select()
        .single();

      if (error) throw error;

      return data;
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
      
      if (action.payload) localStorage.setItem("selectedTeamId", action.payload);
      else localStorage.removeItem("selectedTeamId");
    },
    hydrateSelectedTeamFromStorage: (state) => {
      const saved = typeof window !== "undefined"
        ? localStorage.getItem("selectedTeamId")
        : null;
      state.selectedTeamId = saved ?? null;
      //hydrate current team will be 
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
        // if hydrated selection
        if (state.selectedTeamId) {
        // If we have a saved selection, sync currentTeam to it (if it still exists)
          state.currentTeam =
            state.teams.find(team => team.id === state.selectedTeamId) || null;

          // If the saved selection no longer exists, fall back to the first team
          if (!state.currentTeam && state.teams.length > 0) {
            state.currentTeam = state.teams[0];
            state.selectedTeamId = state.teams[0].id;   // keep ID/UI consistent
          }
        } else if (state.teams.length > 0) {
          // No saved selection → IM-2 rule: first loaded item is selected
          state.currentTeam = state.teams[0];
          state.selectedTeamId = state.teams[0].id;
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
          ...action.payload.team,
          ownerId: action.payload.team.team_creator_id,
          name: action.payload.team.team_name,
          createdAt: action.payload.team.created_at,
          updatedAt: action.payload.team.updated_at,
          settings: {
            allowInvites: action.payload.settings.allow_invites,
            isPublic: action.payload.settings.is_public,
            defaultRole: action.payload.settings
              .default_role as Team["settings"]["defaultRole"],
          },
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
      // Update team name & description
      .addCase(updateTeam.fulfilled, (state, action) => {
        const updatedTeam = state.teams.find(
          (t) => t.id === action.payload.team.id,
        );
        if (updatedTeam) {
          updatedTeam.name = action.payload.team.team_name;
          updatedTeam.description = action.payload.team.description;
        }
      })
      .addCase(updateTeam.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Delete team
      .addCase(deleteTeam.fulfilled, (state, action) => {
        state.teams = state.teams.filter(
          (team) => team.id !== action.payload.id,
        );
      })
      .addCase(deleteTeam.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Invite team member
      .addCase(inviteTeamMember.fulfilled, (state, action) => {
        const invite: TeamInvite = {
          id: action.payload.id,
          teamId: action.payload.team_id,
          email: action.payload.email,
          role: action.payload.role as TeamInvite["role"],
          invitedBy: action.payload.invited_by,
          invitedAt: action.payload.created_at,
          expiresAt: action.payload.expires_at,
          status: action.payload.status as TeamInvite["status"],
        };
        state.teamInvites.push(invite);
      })
      .addCase(inviteTeamMember.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Update team member
      .addCase(updateTeamMember.fulfilled, (state, action) => {
        const index = state.teamMembers.findIndex(
          (member) => member.id === action.payload.user_id,
        );
        if (index !== -1) {
          state.teamMembers[index] = {
            ...state.teamMembers[index],
            ...action.payload,
            role: action.payload.role as TeamMember["role"],
          };
        }
        const teamToUpdate = state.teams.findIndex(
          (t) => t.id === action.payload.team_id,
        );
        if (teamToUpdate !== -1) {
          const memberToUpdate = state.teams[teamToUpdate].members.findIndex(
            (m) => m.id === action.payload.user_id,
          );
          if (memberToUpdate !== -1) {
            state.teams[teamToUpdate].members[memberToUpdate] = {
              ...state.teams[teamToUpdate].members[memberToUpdate],
              ...action.payload,
              role: action.payload.role as TeamMember["role"],
            };
          }
        }
      })
      // Remove team member
      .addCase(removeTeamMember.fulfilled, (state, action) => {
        state.teamMembers = state.teamMembers.filter(
          (member) => member.id !== action.payload.user_id,
        );
        if (state.currentTeam) {
          state.currentTeam.memberCount = Math.max(
            0,
            state.currentTeam.memberCount - 1,
          );
        }

        const teamToUpdate = state.teams.findIndex(
          (t) => t.id === action.payload.team_id,
        );
        if (teamToUpdate !== -1) {
          state.teams[teamToUpdate].members = state.teams[
            teamToUpdate
          ].members.filter((m) => m.userId != action.payload.user_id);
        }
      });
  },
});

export const {
  setCurrentTeam,
  setSelectedTeamId,
  clearError,
  updateTeamLocally,
  hydrateSelectedTeamFromStorage
} = teamsSlice.actions;
export default teamsSlice.reducer;
