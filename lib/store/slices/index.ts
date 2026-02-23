// Author: Bin Lee
// Email: binlee120@gmail.com

// Central exports for store slices: reducers, thunks, actions, and shared types.

export {
  default as authReducer,
  loginUser,
  signUpUser,
  logoutUser,
  getCurrentUser,
  updateUserProfile,
  clearError as clearAuthError,
  setUser,
  setSession,
  setLoading,
  setLoading as setAuthLoading,
  clearAuth,
} from "./authSlice";
export type { User } from "./authSlice";

export {
  default as projectsReducer,
  fetchProjects,
  fetchProjectsForCurrentUser,
  fetchProjectDetails,
  createProject,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
  setCurrentProject,
  setSelectedProjectId,
  setViewMode,
  setFilters,
  clearFilters,
  clearError as clearProjectsError,
  updateProjectLocally,
  hydrateSelectedProjectFromStorage,
} from "./projectsSlice";
export type { Project, ProjectCreation, ProjectUpdate, ProjectMember } from "./projectsSlice";

export {
  default as documentsReducer,
  fetchUserDocuments,
  fetchDocuments,
  fetchDocumentDetails,
  lockSection,
  unlockSection,
  updateSectionContent,
  addComment,
  resolveComment,
  hydrateSelectedDocumentFromStorage,
  setCurrentDocument,
  setSelectedDocumentId as setSelectedDocumentIdDocument,
  setCurrentSection,
  setEditingSection,
  setCommentsVisible,
  clearError as clearDocumentsError,
  updateSectionLocally,
  addSectionLock,
  removeSectionLock,
} from "./documentsSlice";
export type {
  Document,
  DocumentSection,
  DocumentComment,
  DocumentVersion,
} from "./documentsSlice";

export {
  default as uiReducer,
  setCommentsPanelOpen,
  setSidebarOpen,
  hydrateCurrentViewFromStorage,
  toggleSidebar,
  toggleCommentsPanel,
  setCurrentView,
  openModal,
  closeModal,
  closeAllModals,
  removeModal,
  addNotification,
  hideNotification,
  removeNotification,
  clearNotifications,
  setGlobalLoading,
  setLoading as setUiLoading,
  clearLoading as clearUiLoading,
  setBreadcrumbs,
  addBreadcrumb,
  clearBreadcrumbs,
  setTheme,
  setCompactMode,
  setGlobalSearch,
  clearGlobalSearch,
  setError,
  clearError as clearUiError,
  clearAllErrors,
  setFeature,
  setFeatures,
  resetUI,
} from "./uiSlice";
export type { ViewType, Modal, Notification, Breadcrumb } from "./uiSlice";

export { default as pdfAnalysisApiReducer } from "./pdfAnalysisApiSlice";

export {
  default as tenantsReducer,
  fetchUserTenants,
  fetchTenantDetails,
  setCurrentTenant,
  setSelectedTenantId,
  hydrateSelectedTenantFromStorage,
  clearError as clearTenantsError,
  updateTenantLocally,
} from "./tenantsSlice";

export { default as sectionListReducer, fetchSectionList, clearSectionList } from "./sectionListSlice";
export type { SectionListPayload } from "./sectionListSlice";
