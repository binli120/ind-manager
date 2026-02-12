// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import type { AddUserInput, User } from "@/lib/users/types";
import {
  filterUsers,
  findTenantByCompany,
  getToggledUserStatus,
  normalizeCreatedUser,
  normalizeUserPrivilege,
} from "../usersViewModel";

const users: User[] = [
  {
    id: "u1",
    name: "Alice",
    email: "alice@example.com",
    phone: "123",
    role: "project_manager",
    company: "Acme",
    status: "active",
  },
  {
    id: "u2",
    name: "Bob",
    email: "bob@example.com",
    phone: "456",
    role: "medical_monitor",
    company: "BioCorp",
    status: "inactive",
  },
];

describe("lib/users/usersViewModel", () => {
  it("normalizes user privilege", () => {
    expect(normalizeUserPrivilege("system_admin")).toBe("system_admin");
    expect(normalizeUserPrivilege("invalid")).toBe("system_admin");
    expect(normalizeUserPrivilege(null)).toBe("system_admin");
  });

  it("filters users by search and status", () => {
    expect(
      filterUsers({
        users,
        searchQuery: "alice",
        statusFilter: "all",
        tenantFilter: "all",
      }).map((user) => user.id),
    ).toEqual(["u1"]);

    expect(
      filterUsers({
        users,
        searchQuery: "",
        statusFilter: "inactive",
        tenantFilter: "all",
      }).map((user) => user.id),
    ).toEqual(["u2"]);
  });

  it("filters users by tenant", () => {
    expect(
      filterUsers({
        users,
        searchQuery: "",
        statusFilter: "all",
        tenantFilter: "Acme",
      }).map((user) => user.id),
    ).toEqual(["u1"]);
  });

  it("toggles user status", () => {
    expect(getToggledUserStatus("active")).toBe("inactive");
    expect(getToggledUserStatus("inactive")).toBe("active");
    expect(getToggledUserStatus("pending")).toBe("active");
  });

  it("normalizes created user payload", () => {
    const input: AddUserInput = {
      name: "Alice",
      email: "alice@example.com",
      phone: "123",
      role: "project_manager",
      privilege: "user",
      company: "Acme",
    };

    const normalized = normalizeCreatedUser({
      createdUser: {
        id: "u3",
        name: "Alice",
        email: "alice@example.com",
        phone: undefined,
        role: "project_manager",
        company: "Acme",
      },
      input,
    });

    expect(normalized.id).toBe("u3");
    expect(normalized.phone).toBe("");
    expect(normalized.privilege).toBe("user");
    expect(normalized.status).toBe("pending");
  });

  it("finds tenant by company", () => {
    const tenant = findTenantByCompany({
      tenants: [
        { id: "t1", name: "Acme" },
        { id: "t2", name: "BioCorp" },
      ],
      company: "BioCorp",
    });

    expect(tenant?.id).toBe("t2");
  });
});
