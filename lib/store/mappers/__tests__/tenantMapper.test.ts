import {
  mapTenantRowToTenant,
  mapTenantRowsToTenants,
  type TenantRow,
} from "../tenantMapper";

describe("tenantMapper", () => {
  it("maps a tenant row", () => {
    const row: TenantRow = {
      id: "t1",
      name: "Acme",
      contact_person: "Alice",
      status: "active",
    };

    expect(mapTenantRowToTenant(row)).toEqual({
      id: "t1",
      name: "Acme",
      address: null,
      contactPerson: "Alice",
      contactEmail: null,
      contactNumber: null,
      status: "active",
      ownerUserId: null,
      metadata: undefined,
      createdAt: null,
    });
  });

  it("maps multiple tenant rows", () => {
    expect(mapTenantRowsToTenants([{ id: "t1", name: "Acme" }])).toHaveLength(
      1,
    );
  });
});
