import {
  Dialog,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge, Edit3 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { Team, fetchTeamDetails } from "@/lib/store/slices/teamsSlice";
import { canManageTeam, getRoleColor, getRoleIcon } from "./utils";
import { Avatar, AvatarFallback } from "../avatar";
import { useEffect, useState } from "react";

type ViewTeamDialogProps = {
  showViewTeam: boolean;
  setShowViewTeam: (value: boolean) => void;
  selectedTeamId: string | null;
  setSelectedTeamId: (teamId: string | null) => void;
  handleEditTeam: (team: Team) => void;
};

export const ViewTeamDialog: React.FC<ViewTeamDialogProps> = ({
  showViewTeam,
  setShowViewTeam,
  selectedTeamId,
  setSelectedTeamId,
  handleEditTeam,
}) => {
  const { user } = useAppSelector((app) => app.auth);
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
    setShowViewTeam(open);
  };

  if (teamDetails == null) return <></>;
  return (
    <Dialog open={showViewTeam} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Team Details</DialogTitle>
          <DialogDescription>
            View team information and members
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Team Name</Label>
            <p className="text-sm mt-1">{teamDetails.name}</p>
          </div>
          {teamDetails.description && (
            <div>
              <Label className="text-sm font-medium">Description</Label>
              <p className="text-sm mt-1">{teamDetails.description}</p>
            </div>
          )}
          <div>
            <Label className="text-sm font-medium">
              Members ({teamDetails.members.length})
            </Label>
            <div className="mt-2 space-y-2">
              {teamDetails.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>
                        {member.name?.charAt(0) || member.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {member.name || member.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={`${getRoleColor(member.role || "member")} text-white text-xs`}
                  >
                    {getRoleIcon(member.role || "member")}
                    {member.role || "member"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowViewTeam(false)}>
            Close
          </Button>
          {canManageTeam(teamDetails, user) && (
            <Button
              onClick={() => {
                setShowViewTeam(false);
                handleEditTeam(teamDetails);
              }}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Team
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
