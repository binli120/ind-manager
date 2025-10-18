import { Team, fetchTeamDetails } from "@/lib/store/slices/teamsSlice";
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
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/lib/store";

type EditTeamDialogProps = {
  showEditTeam: boolean;
  setShowEditTeam: (value: boolean) => void;
  selectedTeamId: string | null;
  setSelectedTeamId: (teamId: string | null) => void;
  handleUpdateTeam: (team: Team) => void;
};
export const EditTeamDialog: React.FC<EditTeamDialogProps> = ({
  showEditTeam,
  setShowEditTeam,
  selectedTeamId,
  setSelectedTeamId,
  handleUpdateTeam,
}) => {
  const dispatch = useAppDispatch();

  const [teamDetails, setTeamDetails] = useState<Team | null>(null);

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
    setShowEditTeam(open);
  };

  if (teamDetails == null) return <></>;

  return (
    <Dialog open={showEditTeam} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
          <DialogDescription>Update team information</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit_team_name">Team Name</Label>
            <Input
              id="edit_team_name"
              value={teamDetails.name}
              onChange={(e) => {
                setTeamDetails((prev) => {
                  if (prev) {
                    return {
                      ...prev,
                      name: e.target.value,
                    };
                  } else return null;
                });
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_description">Description</Label>
            <Textarea
              id="edit_description"
              value={teamDetails.description ?? undefined}
              onChange={(e) => {
                setTeamDetails((prev) => {
                  if (prev) {
                    return {
                      ...prev,
                      description: e.target.value,
                    };
                  } else return null;
                });
              }}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowEditTeam(false)}>
            Cancel
          </Button>
          <Button onClick={() => handleUpdateTeam(teamDetails)}>
            Update Team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
