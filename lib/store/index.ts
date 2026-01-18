import { configureStore } from "@reduxjs/toolkit"
import { type TypedUseSelectorHook, useDispatch, useSelector } from "react-redux"
import authSlice from "./slices/authSlice"
import projectsSlice from "./slices/projectsSlice"
import documentsSlice from "./slices/documentsSlice"
import uiSlice from "./slices/uiSlice"
import notificationsSlice from "./slices/notificationsSlice"
import tenantsSlice from "./slices/tenantsSlice";




export const store = configureStore({
  reducer: {
    auth: authSlice,
    tenants: tenantsSlice,
    projects: projectsSlice,
    documents: documentsSlice,
    ui: uiSlice,
    notifications: notificationsSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
