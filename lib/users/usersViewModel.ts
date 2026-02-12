// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import type {
  AddUserInput,
  Tenant,
  User,
  UserPrivilege,
  UserStatusFilter,
} from "@/lib/users/types";
import { roleLabels } from "@/lib/users/types";

export const normalizeUserPrivilege = (value: unknown): UserPrivilege => {
  if (value === "system_admin" || value === "user_manager" || value === "user") {
    return value;
  }
  return "system_admin";
};

export const filterUsers = ({
  users,
  searchQuery,
  statusFilter,
}: {
  users: User[];
  searchQuery: string;
  statusFilter: UserStatusFilter;
}) => {
  const normalizedSearch = searchQuery.trim().toLowerCase();

  return users.filter((user) => {
    const matchesSearch =
      !normalizedSearch ||
      (user.name ?? "").toLowerCase().includes(normalizedSearch) ||
      user.email.toLowerCase().includes(normalizedSearch) ||
      roleLabels[user.role].toLowerCase().includes(normalizedSearch);

    const matchesStatus = statusFilter === "all" || user.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
};

export const getToggledUserStatus = (currentStatus: User["status"]) =>
  currentStatus === "active" ? "inactive" : "active";

export const normalizeCreatedUser = ({
  createdUser,
  input,
}: {
  createdUser: Partial<User>;
  input: AddUserInput;
}): User => ({
  id: createdUser.id ?? "",
  name: createdUser.name ?? input.name,
  email: createdUser.email ?? input.email,
  phone: (createdUser.phone ?? "").toString(),
  role: createdUser.role ?? input.role,
  company: createdUser.company ?? input.company,
  password: createdUser.password ?? input.password,
  privilege: createdUser.privilege ?? input.privilege,
  status:
    createdUser.status === "active" ||
    createdUser.status === "inactive" ||
    createdUser.status === "pending"
      ? createdUser.status
      : "pending",
});

export const findTenantByCompany = ({
  tenants,
  company,
}: {
  tenants: Tenant[];
  company: string;
}) => tenants.find((tenant) => tenant.name === company) ?? null;
