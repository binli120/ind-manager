export const ManageRolesDialog: React.FC = () => {
  return (
      {showManageRoles && selectedTeam && (
        <Dialog open={showManageRoles} onOpenChange={setShowManageRoles}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Manage Roles - {selectedTeam.team_name}</DialogTitle>
              <DialogDescription>Update member roles and permissions</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Team Members</Label>
                <div className="space-y-2">
                  {selectedTeam.members.map(member => (
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
                          <p className="text-sm font-medium">{member.name || member.email}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {member.id === selectedTeam.team_creator_id ? (
                          <Badge variant="default">
                            <Crown className="h-3 w-3 mr-1" />
                            Owner
                          </Badge>
                        ) : canEditMember(selectedTeam, member) ? (
                          <Select
                            value={member.role}
                            onValueChange={value =>
                              handleUpdateRole(selectedTeam.id, member.id, value)
                            }
                          >
                            <SelectTrigger className="h-8 w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={`${getRoleColor(member.role)} text-white text-xs`}>
                            {getRoleIcon(member.role)}
                            {member.role}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowManageRoles(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
  )});
}
