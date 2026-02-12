// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import { authReducer, clearAuth, setUser, type User } from "../slices"

describe("authSlice reducers", () => {
  it("sets and clears user auth state", () => {
    const user: User = {
      id: "123",
      email: "a@b.com",
      privilege: "system_admin",
      role: "project_owner",
      createdAt: "now",
    }

    const stateWithUser = authReducer(undefined, setUser(user))
    expect(stateWithUser.user?.email).toBe("a@b.com")
    expect(stateWithUser.isAuthenticated).toBe(true)

    const clearedState = authReducer(stateWithUser, clearAuth())
    expect(clearedState.user).toBeNull()
    expect(clearedState.isAuthenticated).toBe(false)
  })
})
