import { createListenerMiddleware } from "@reduxjs/toolkit"
import { setSelectedTeamId } from "../slices/teamsSlice"
import { setSelectedProjectId } from "../slices/projectsSlice"

const selectionPersistenceMiddleware = createListenerMiddleware()

const persist = (key: string, value: string | null) => {
  if (typeof window === "undefined") return

  if (value) {
    window.localStorage.setItem(key, value)
  } else {
    window.localStorage.removeItem(key)
  }
}

selectionPersistenceMiddleware.startListening({
  actionCreator: setSelectedTeamId,
  effect: async (action) => {
    persist("selectedTeamId", action.payload)
  },
})

selectionPersistenceMiddleware.startListening({
  actionCreator: setSelectedProjectId,
  effect: async (action) => {
    persist("selectedProjectId", action.payload)
  },
})

export const selectionPersistence = selectionPersistenceMiddleware
