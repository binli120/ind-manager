// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import { authServices } from "@/app/api/auth/auth-services";
import { fetchProjects } from "@/lib/supabase/projects";
import { createUser, fetchTenants, fetchUsers, updateUserStatus } from "@/lib/supabase";
import type { Project } from "@/lib/projects/types";
import {
  filterUsers,
  findTenantByCompany,
  getToggledUserStatus,
  normalizeCreatedUser,
  normalizeUserPrivilege,
} from "@/lib/users/usersViewModel";
import type {
  AddUserInput,
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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [companies, setCompanies] = useState<string[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentUserPrivilege, setCurrentUserPrivilege] =
    useState<UserPrivilege>("user");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedUserForAssignment, setSelectedUserForAssignment] =
    useState<User | null>(null);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);

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
      }),
    [users, searchQuery, statusFilter],
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
    const { error: authError } = await authServices.signUp(
      formUser.email,
      formUser.password,
      {
        name: formUser.name,
        privilege: formUser.privilege,
      },
    );

    if (authError) {
      console.error("signup failed:", authError);
      return;
    }

    const selectedTenant = findTenantByCompany({
      tenants,
      company: formUser.company,
    });
    if (!selectedTenant) {
      console.error("Selected company not found in tenants list");
      return;
    }

    const authUserId = `user-${Date.now()}`;
    const createdUser = await createUser({
      id: authUserId,
      name: formUser.name,
      email: formUser.email,
      phone: formUser.phone,
      role: formUser.role,
      tenantId: selectedTenant.id,
    });

    const normalizedUser = normalizeCreatedUser({
      createdUser,
      input: formUser,
    });
    setUsers((previousUsers) => [...previousUsers, normalizedUser]);

    await authServices.resetPassword(formUser.email);
  };

  const handleAssignProjects = (user: User) => {
    setSelectedUserForAssignment(user);
    setIsAssignDialogOpen(true);
  };

  return {
    users,
    filteredUsers,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    isAddDialogOpen,
    setIsAddDialogOpen,
    companies,
    currentUserPrivilege,
    isAssignDialogOpen,
    setIsAssignDialogOpen,
    selectedUserForAssignment,
    availableProjects,
    handleToggleStatus,
    handleAddUser,
    handleAssignProjects,
  };
}
