import { fetchUsers, updateUserStatus, createUser, fetchCurrentUser } from "../users"

const mockFetch = jest.fn()

const sampleUser = {
  id: "u1",
  name: "Alice",
  email: "alice@example.com",
  phone: "123",
  role: "project_manager",
  status: "active",
  tenants: { name: "Acme" },
}

describe("lib/supabase/users", () => {
  beforeAll(() => {
    global.fetch = mockFetch as unknown as typeof fetch
  })

  beforeEach(() => {
    mockFetch.mockReset()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [sampleUser] }),
    })
  })

  it("maps fetchUsers response", async () => {
    const users = await fetchUsers()
    expect(mockFetch).toHaveBeenCalled()
    expect(users[0]).toEqual({
      id: "u1",
      name: "Alice",
      email: "alice@example.com",
      phone: "123",
      role: "project_manager",
      company: "Acme",
      status: "active",
    })
  })

  it("maps updateUserStatus response", async () => {
    const user = await updateUserStatus("u1", "inactive")
    expect(user.status).toBe("active") // echoed from mock sampleUser
  })

  it("maps createUser response", async () => {
    const user = await createUser({
      id: "u1",
      name: "Alice",
      email: "alice@example.com",
      phone: "123",
      role: "project_manager" as any,
      tenantId: "t1",
    })
    expect(user.company).toBe("Acme")
  })

  it("returns current user", async () => {
    const user = await fetchCurrentUser("u1")
    expect(user?.id).toBe("u1")
  })
})
