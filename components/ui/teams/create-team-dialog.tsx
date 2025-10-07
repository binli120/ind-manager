import {
  Dialog,
  DialogTrigger,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/useToast";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { createTeam, inviteTeamMember } from "@/lib/store/slices/teamsSlice";

export const CreateTeamDialog: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((app) => app.auth);

  // Form states
  const [newTeamData, setNewTeamData] = useState({
    team_name: "",
    description: "",
    memberEmails: [] as string[],
  });

  // Dialog states
  const [showCreateTeam, setShowCreateTeam] = useState(false);

  // Form errors
  const [createTeamErrors, setCreateTeamErrors] = useState<
    Record<string, boolean>
  >({});

  const handleCreateTeam = async () => {
    const errors: Record<string, boolean> = {};

    if (!newTeamData.team_name.trim()) errors.team_name = true;
    if (newTeamData.memberEmails.length === 0) errors.members = true;

    if (Object.keys(errors).length > 0) {
      setCreateTeamErrors(errors);
      return;
    }

    try {
      const createRes = await dispatch(
        createTeam({
          name: newTeamData.team_name,
          description: newTeamData.description,
        }),
      ).unwrap();

      for (const email of newTeamData.memberEmails.filter(
        (email) => email !== user?.email,
      )) {
        const _inviteRes = await dispatch(
          inviteTeamMember({
            teamId: createRes.id,
            email: email,
            role: "member",
          }),
        ).unwrap();
      }

      setNewTeamData({ team_name: "", description: "", memberEmails: [] });
      setCreateTeamErrors({});
      setShowCreateTeam(false);

      toast({
        title: "Success",
        description: "Team created successfully!",
      });
    } catch (error) {
      console.error("Error creating team:", error);
      toast({
        title: "Error",
        description: "Failed to create team",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setShowCreateTeam(false);
    setNewTeamData({ team_name: "", description: "", memberEmails: [] });
    setCreateTeamErrors({});
  };

  return (
    <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
          <DialogDescription>
            Create a new team and add members to collaborate on IND projects.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team_name">Team Name *</Label>
            <Input
              id="team_name"
              placeholder="Enter team name"
              value={newTeamData.team_name}
              onChange={(e) => {
                setNewTeamData((prev) => ({
                  ...prev,
                  team_name: e.target.value,
                }));
                setCreateTeamErrors((prev) => ({
                  ...prev,
                  team_name: false,
                }));
              }}
              className={createTeamErrors.team_name ? "border-red-500" : ""}
            />
            {createTeamErrors.team_name && (
              <p className="text-sm text-red-500">Team name is required</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter team description"
              value={newTeamData.description}
              onChange={(e) =>
                setNewTeamData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Add Members *</Label>
            <div className="space-y-2">
              {newTeamData.memberEmails.map((email, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={email}
                    onChange={(e) => {
                      const newEmails = [...newTeamData.memberEmails];
                      newEmails[index] = e.target.value;
                      setNewTeamData((prev) => ({
                        ...prev,
                        memberEmails: newEmails,
                      }));
                    }}
                    placeholder="member@example.com"
                    type="email"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const newEmails = newTeamData.memberEmails.filter(
                        (_, i) => i !== index,
                      );
                      setNewTeamData((prev) => ({
                        ...prev,
                        memberEmails: newEmails,
                      }));
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setNewTeamData((prev) => ({
                    ...prev,
                    memberEmails: [...prev.memberEmails, ""],
                  }));
                }}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>
            {createTeamErrors.members && (
              <p className="text-sm text-red-500">
                Add at least one team member
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleCancel()}>
            Cancel
          </Button>
          <Button onClick={handleCreateTeam}>Create Team</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
