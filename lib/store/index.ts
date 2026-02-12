// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
import { configureStore } from "@reduxjs/toolkit"
import { type TypedUseSelectorHook, useDispatch, useSelector } from "react-redux"
import authSlice from "./slices/authSlice"
import projectsSlice, { hydrateSelectedProjectFromStorage } from "./slices/projectsSlice"
import documentsSlice, { hydrateSelectedDocumentFromStorage } from "./slices/documentsSlice"
import uiSlice, { hydrateCurrentViewFromStorage } from "./slices/uiSlice"
import notificationsSlice from "./slices/notificationsSlice"
import tenantsSlice from "./slices/tenantsSlice";
import sectionListSlice from "./slices/sectionListSlice"




export const store = configureStore({
  reducer: {
    auth: authSlice,
    tenants: tenantsSlice,
    projects: projectsSlice,
    documents: documentsSlice,
    ui: uiSlice,
    notifications: notificationsSlice,
    sectionList: sectionListSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
    }),
})

const canUseDOM = typeof window !== "undefined"

const persistString = (key: string, value: string | null) => {
  if (!canUseDOM) return
  try {
    if (value) localStorage.setItem(key, value)
    else localStorage.removeItem(key)
  } catch {
    // Ignore storage failures (private mode, quota, etc.)
  }
}

if (canUseDOM) {
  store.dispatch(hydrateSelectedProjectFromStorage())
  store.dispatch(hydrateSelectedDocumentFromStorage())
  store.dispatch(hydrateCurrentViewFromStorage())

  let lastSelectedProjectId = store.getState().projects.selectedProjectId
  let lastSelectedDocumentId = store.getState().documents.selectedDocumentId
  let lastCurrentView = store.getState().ui.currentView

  store.subscribe(() => {
    const state = store.getState()
    const currentUserId = state.auth.user?.id ?? null

    if (state.projects.selectedProjectId !== lastSelectedProjectId) {
      lastSelectedProjectId = state.projects.selectedProjectId
      persistString("selectedProjectId", lastSelectedProjectId)
      if (currentUserId) {
        persistString(
          `selectedProjectId:${currentUserId}`,
          lastSelectedProjectId,
        )
      }
    }

    if (state.documents.selectedDocumentId !== lastSelectedDocumentId) {
      lastSelectedDocumentId = state.documents.selectedDocumentId
      persistString("selectedDocumentId", lastSelectedDocumentId)
    }

    if (state.ui.currentView !== lastCurrentView) {
      lastCurrentView = state.ui.currentView
      persistString("currentView", lastCurrentView)
    }
  })
}

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
