import {
  Team,
  fetchTeamDetails,
  inviteTeamMember,
} from "@/lib/store/slices/teamsSlice";
import {
  Dialog,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/lib/store";
import { UserPlus } from "lucide-react";

type AddMembersDialogProps = {
  showAddMembers: boolean;
  setShowAddMembers: (value: boolean) => void;
  selectedTeamId: string | null;
  setSelectedTeamId: (teamId: string | null) => void;
};
export const AddMembersDialog: React.FC<AddMembersDialogProps> = ({
  showAddMembers,
  setShowAddMembers,
  selectedTeamId,
  setSelectedTeamId,
}) => {
  const dispatch = useAppDispatch();

  const [teamDetails, setTeamDetails] = useState<Team | null>(null);

  const [newMemberEmails, setNewMemberEmails] = useState<{
    [teamId: string]: string;
  }>({});

  useEffect(() => {
    if (selectedTeamId) {
      dispatch(fetchTeamDetails(selectedTeamId))
        .unwrap()
        .then((res) => setTeamDetails(res.team));
    } else {
      setTeamDetails(null);
    }
  }, [dispatch, selectedTeamId]);

  const onOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedTeamId(null);
    }
    setShowAddMembers(open);
  };

  const handleAddMember = (teamId: string, email: string) => {
    dispatch(
      inviteTeamMember({
        teamId,
        email,
        role: teamDetails?.settings.defaultRole ?? "viewer",
      }),
    );
  };

  if (teamDetails == null) return <></>;

  return (
    <Dialog open={showAddMembers} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Members to {teamDetails.name}</DialogTitle>
          <DialogDescription>Invite new members to your team</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Email Address</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="member@example.com"
                value={newMemberEmails[teamDetails.id] || ""}
                onChange={(e) =>
                  setNewMemberEmails((prev) => ({
                    ...prev,
                    [teamDetails.id]: e.target.value,
                  }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newMemberEmails[teamDetails.id]) {
                    handleAddMember(
                      teamDetails.id,
                      newMemberEmails[teamDetails.id],
                    );
                  }
                }}
              />
              <Button
                onClick={() => {
                  if (newMemberEmails[teamDetails.id]) {
                    handleAddMember(
                      teamDetails.id,
                      newMemberEmails[teamDetails.id],
                    );
                  }
                }}
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowAddMembers(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
