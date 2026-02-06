import { fetchTenants, updateTenantStatus, createTenant } from "../tenants"

const mockFetch = jest.fn()

const sampleTenant = {
  id: "t1",
  name: "Acme",
  address: "123 St",
  contact_person: "Alice",
  contact_email: "alice@example.com",
  contact_number: "123",
  status: "active",
}

describe("lib/supabase/tenants", () => {
  beforeAll(() => {
    global.fetch = mockFetch as unknown as typeof fetch
  })

  beforeEach(() => {
    mockFetch.mockReset()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [sampleTenant] }),
    })
  })

  it("maps fetchTenants response", async () => {
    const tenants = await fetchTenants()
    expect(tenants[0]).toEqual({
      id: "t1",
      name: "Acme",
      companyAddress: "123 St",
      contactPerson: "Alice",
      contactEmail: "alice@example.com",
      contactPhone: "123",
      status: "active",
    })
  })

  it("maps updateTenantStatus response", async () => {
    const tenant = await updateTenantStatus("t1", "inactive")
    expect(tenant.name).toBe("Acme")
  })

  it("maps createTenant response", async () => {
    const tenant = await createTenant({
      name: "Acme",
      contactPerson: "Alice",
      contactEmail: "alice@example.com",
      contactPhone: "123",
      companyAddress: "123 St",
    })
    expect(tenant.status).toBe("active")
  })
})
