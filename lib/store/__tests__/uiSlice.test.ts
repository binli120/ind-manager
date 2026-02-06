import {
  uiReducer,
  setSidebarOpen,
  toggleSidebar,
  openModal,
  hideNotification,
  addNotification,
} from "../slices"

describe("uiSlice reducers", () => {
  it("toggles sidebar state", () => {
    const opened = uiReducer(undefined, setSidebarOpen(false))
    expect(opened.sidebarOpen).toBe(false)

    const toggled = uiReducer(opened, toggleSidebar())
    expect(toggled.sidebarOpen).toBe(true)
  })

  it("opens modal and hides notifications", () => {
    const withModal = uiReducer(
      undefined,
      openModal({ id: "m1", type: "custom", title: "Test" }),
    )
    expect(withModal.modals[0]?.isOpen).toBe(true)

    const withNotification = uiReducer(
      undefined,
      addNotification({ type: "info", title: "Hello" }),
    )
    const id = withNotification.notifications[0]?.id as string
    const hidden = uiReducer(withNotification, hideNotification(id))
    expect(hidden.notifications[0]?.isVisible).toBe(false)
  })
})
