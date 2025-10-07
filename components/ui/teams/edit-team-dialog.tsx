import { Team } from "@/lib/store/slices/teamsSlice";
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

type EditTeamDialogProps = {
  showEditTeam: boolean;
  setShowEditTeam: (value: boolean) => void;
  selectedTeam: Team | null;
};
export const EditTeamDialog: React.FC<EditTeamDialogProps> = ({
  showEditTeam,
  setShowEditTeam,
  selectedTeam,
}) => {
  const dispatch = useAppDispatch();

  if (!showEditTeam || selectedTeam == null) return <></>;

  return (
    <Dialog open={showEditTeam} onOpenChange={setShowEditTeam}>
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
              value={editTeamData.team_name}
              onChange={(e) =>
                setEditTeamData((prev) => ({
                  ...prev,
                  team_name: e.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_description">Description</Label>
            <Textarea
              id="edit_description"
              value={editTeamData.description}
              onChange={(e) =>
                setEditTeamData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowEditTeam(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpdateTeam}>Update Team</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
