{
  /* Add Members Dialog */
}
{
  showAddMembers && selectedTeam && (
    <Dialog open={showAddMembers} onOpenChange={setShowAddMembers}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Members to {selectedTeam.team_name}</DialogTitle>
          <DialogDescription>Invite new members to your team</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Email Address</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="member@example.com"
                value={newMemberEmails[selectedTeam.id] || ""}
                onChange={(e) =>
                  setNewMemberEmails((prev) => ({
                    ...prev,
                    [selectedTeam.id]: e.target.value,
                  }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newMemberEmails[selectedTeam.id]) {
                    handleAddMember(
                      selectedTeam.id,
                      newMemberEmails[selectedTeam.id],
                    );
                  }
                }}
              />
              <Button
                onClick={() => {
                  if (newMemberEmails[selectedTeam.id]) {
                    handleAddMember(
                      selectedTeam.id,
                      newMemberEmails[selectedTeam.id],
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
}
