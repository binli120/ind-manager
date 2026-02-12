// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import { authServices } from "@/lib/auth/auth-services";
import { fetchProjects } from "@/lib/supabase/projects";
import {
  fetchTenants,
  fetchUsers,
  inviteUser,
  updateUser,
  updateUserStatus,
} from "@/lib/supabase";
import type { Project } from "@/lib/projects/types";
import {
  filterUsers,
  findTenantByCompany,
  getToggledUserStatus,
  normalizeUserPrivilege,
} from "@/lib/users/usersViewModel";
import type {
  AddUserInput,
  EditUserInput,
  Tenant,
  User,
  UserPrivilege,
  UserStatusFilter,
} from "@/lib/users/types";
import { useEffect, useMemo, useState } from "react";

export function useUsersPageController() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>("all");
  const [tenantFilter, setTenantFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [companies, setCompanies] = useState<string[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentUserPrivilege, setCurrentUserPrivilege] =
    useState<UserPrivilege>("user");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedUserForAssignment, setSelectedUserForAssignment] =
    useState<User | null>(null);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(
    null,
  );
  const [isSavingUserEdit, setIsSavingUserEdit] = useState(false);

  useEffect(() => {
    let isActive = true;

    const initializeUserData = async () => {
      const authData = await authServices.getUser();
      const authUser = authData.data?.user;
      if (!authUser || !isActive) return;

      const privilege = normalizeUserPrivilege(authUser.user_metadata?.privilege);
      setCurrentUserPrivilege(privilege);

      const targetTenantId: string | undefined = undefined;
      const [usersData, projectsData, tenantsData] = await Promise.all([
        fetchUsers(targetTenantId),
        fetchProjects(targetTenantId),
        fetchTenants(targetTenantId),
      ]);

      if (!isActive) return;

      setUsers(usersData);
      setAvailableProjects(projectsData);
      setTenants(tenantsData);
      setCompanies(tenantsData.map((tenant) => tenant.name));
    };

    void initializeUserData();

    return () => {
      isActive = false;
    };
  }, []);

  const filteredUsers = useMemo(
    () =>
      filterUsers({
        users,
        searchQuery,
        statusFilter,
        tenantFilter,
      }),
    [users, searchQuery, statusFilter, tenantFilter],
  );

  const handleToggleStatus = async (userId: string) => {
    const currentUser = users.find((entry) => entry.id === userId);
    if (!currentUser) return;

    const nextStatus = getToggledUserStatus(currentUser.status);
    const updatedUser = await updateUserStatus(userId, nextStatus);

    setUsers((previousUsers) =>
      previousUsers.map((entry) =>
        entry.id === userId
          ? {
              ...entry,
              ...updatedUser,
              phone: (updatedUser?.phone ?? entry.phone ?? "").toString(),
              status: (updatedUser?.status as User["status"]) ?? entry.status,
            }
          : entry,
      ),
    );
  };

  const handleAddUser = async (formUser: AddUserInput) => {
    const selectedTenant = formUser.company
      ? findTenantByCompany({
          tenants,
          company: formUser.company,
        })
      : null;
    if (formUser.privilege !== "system_admin" && !selectedTenant) {
      throw new Error("Tenant is required for non-system-admin users");
    }

    const createdUser = await inviteUser({
      name: formUser.name,
      email: formUser.email,
      phone: formUser.phone,
      role: formUser.role,
      tenantId: selectedTenant?.id,
      privilege: formUser.privilege,
    });

    setUsers((previousUsers) => [...previousUsers, createdUser]);
  };

  const handleAssignProjects = (user: User) => {
    setSelectedUserForAssignment(user);
    setIsAssignDialogOpen(true);
  };

  const handleOpenEditUser = (user: User) => {
    setSelectedUserForEdit(user);
    setIsEditDialogOpen(true);
  };

  const handleEditDialogOpenChange = (open: boolean) => {
    if (!open && isSavingUserEdit) return;
    setIsEditDialogOpen(open);
    if (!open) {
      setSelectedUserForEdit(null);
    }
  };

  const handleSaveEditedUser = async (editedUser: EditUserInput) => {
    if (!selectedUserForEdit) return;
    const selectedTenant = findTenantByCompany({
      tenants,
      company: editedUser.company,
    });
    if (!selectedTenant) {
      console.error("Selected company not found in tenants list");
      return;
    }

    setIsSavingUserEdit(true);
    try {
      const updated = await updateUser({
        id: selectedUserForEdit.id,
        name: editedUser.name,
        email: editedUser.email,
        phone: editedUser.phone,
        role: editedUser.role,
        tenantId: selectedTenant.id,
      });

      setUsers((previousUsers) =>
        previousUsers.map((entry) =>
          entry.id === selectedUserForEdit.id
            ? {
                ...entry,
                ...updated,
                company: editedUser.company,
              }
            : entry,
        ),
      );
      setIsEditDialogOpen(false);
      setSelectedUserForEdit(null);
    } catch (error) {
      console.error("Failed to update user:", error);
    } finally {
      setIsSavingUserEdit(false);
    }
  };

  return {
    users,
    filteredUsers,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    tenantFilter,
    setTenantFilter,
    isAddDialogOpen,
    setIsAddDialogOpen,
    companies,
    currentUserPrivilege,
    isAssignDialogOpen,
    setIsAssignDialogOpen,
    selectedUserForAssignment,
    availableProjects,
    isEditDialogOpen,
    selectedUserForEdit,
    isSavingUserEdit,
    handleToggleStatus,
    handleAddUser,
    handleAssignProjects,
    handleOpenEditUser,
    handleEditDialogOpenChange,
    handleSaveEditedUser,
  };
}
