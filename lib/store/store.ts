// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
// Legacy compatibility layer.
// Prefer importing from `@/lib/store` (this file exists to avoid breaking old imports).

export { store, type RootState, type AppDispatch, useAppDispatch, useAppSelector } from "./index"

import { useAppSelector } from "./index"

export const useAuthUser = () => useAppSelector((s) => s.auth.user)
export const useIsAuthenticated = () => useAppSelector((s) => s.auth.isAuthenticated)
export const useAuthLoading = () => useAppSelector((s) => s.auth.isLoading)
