import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ViewType =
  | 'workspace'
  | 'projects'
  | 'teams'
  | 'calendar'
  | 'submission'
  | 'post-submission'
  | 'gap-scoring'
  | 'review-center'
  | 'gap-analysis'
  | 'ind-submission'
  | 'design-system'
  | 'tenants'
  | 'users';

export interface Modal {
  id: string;
  type:
    | 'create-project'
    | 'create-team'
    | 'invite-member'
    | 'delete-confirm'
    | 'settings'
    | 'custom';
  title?: string;
  data?: any;
  isOpen: boolean;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  isVisible: boolean;
  createdAt: string;
}

export interface Breadcrumb {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface UIState {
  // Layout state
  sidebarOpen: boolean;
  commentsPanelOpen: boolean;
  currentView: ViewType;

  // Modal state
  modals: Modal[];

  // Notification state
  notifications: Notification[];

  // Loading states
  globalLoading: boolean;
  loadingStates: Record<string, boolean>;

  // Navigation state
  breadcrumbs: Breadcrumb[];

  // Theme and preferences
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;

  // Search and filters
  globalSearch: string;

  // Error handling
  errors: Record<string, string>;

  // Feature flags
  features: Record<string, boolean>;
}

const initialState: UIState = {
  sidebarOpen: true,
  commentsPanelOpen: true,
  currentView: 'workspace',
  modals: [],
  notifications: [],
  globalLoading: false,
  loadingStates: {},
  breadcrumbs: [],
  theme: 'system',
  compactMode: false,
  globalSearch: '',
  errors: {},
  features: {
    realTimeCollaboration: true,
    advancedSearch: true,
    aiAssistant: false,
    exportToPdf: true,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Layout actions
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setCommentsPanelOpen: (state, action: PayloadAction<boolean>) => {
      state.commentsPanelOpen = action.payload;
    },
    toggleCommentsPanel: (state) => {
      state.commentsPanelOpen = !state.commentsPanelOpen;
    },
    setCurrentView: (state, action: PayloadAction<ViewType>) => {
      state.currentView = action.payload;
    },

    // Modal actions
    openModal: (state, action: PayloadAction<Omit<Modal, 'isOpen'>>) => {
      const existingModal = state.modals.find(
        (modal) => modal.id === action.payload.id
      );
      if (existingModal) {
        existingModal.isOpen = true;
        existingModal.data = action.payload.data;
      } else {
        state.modals.push({ ...action.payload, isOpen: true });
      }
    },
    closeModal: (state, action: PayloadAction<string>) => {
      const modal = state.modals.find((modal) => modal.id === action.payload);
      if (modal) {
        modal.isOpen = false;
      }
    },
    closeAllModals: (state) => {
      state.modals.forEach((modal) => {
        modal.isOpen = false;
      });
    },
    removeModal: (state, action: PayloadAction<string>) => {
      state.modals = state.modals.filter(
        (modal) => modal.id !== action.payload
      );
    },

    // Notification actions
    addNotification: (
      state,
      action: PayloadAction<
        Omit<Notification, 'id' | 'isVisible' | 'createdAt'>
      >
    ) => {
      const notification: Notification = {
        ...action.payload,
        id: `notification-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        isVisible: true,
        createdAt: new Date().toISOString(),
      };
      state.notifications.push(notification);
    },
    hideNotification: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(
        (n) => n.id === action.payload
      );
      if (notification) {
        notification.isVisible = false;
      }
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (n) => n.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },

    // Loading actions
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.globalLoading = action.payload;
    },
    setLoading: (
      state,
      action: PayloadAction<{ key: string; loading: boolean }>
    ) => {
      state.loadingStates[action.payload.key] = action.payload.loading;
    },
    clearLoading: (state, action: PayloadAction<string>) => {
      delete state.loadingStates[action.payload];
    },

    // Navigation actions
    setBreadcrumbs: (state, action: PayloadAction<Breadcrumb[]>) => {
      state.breadcrumbs = action.payload;
    },
    addBreadcrumb: (state, action: PayloadAction<Breadcrumb>) => {
      state.breadcrumbs.push(action.payload);
    },
    clearBreadcrumbs: (state) => {
      state.breadcrumbs = [];
    },

    // Theme and preferences
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    setCompactMode: (state, action: PayloadAction<boolean>) => {
      state.compactMode = action.payload;
    },

    // Search actions
    setGlobalSearch: (state, action: PayloadAction<string>) => {
      state.globalSearch = action.payload;
    },
    clearGlobalSearch: (state) => {
      state.globalSearch = '';
    },

    // Error handling
    setError: (
      state,
      action: PayloadAction<{ key: string; error: string }>
    ) => {
      state.errors[action.payload.key] = action.payload.error;
    },
    clearError: (state, action: PayloadAction<string>) => {
      delete state.errors[action.payload];
    },
    clearAllErrors: (state) => {
      state.errors = {};
    },

    // Feature flags
    setFeature: (
      state,
      action: PayloadAction<{ key: string; enabled: boolean }>
    ) => {
      state.features[action.payload.key] = action.payload.enabled;
    },
    setFeatures: (state, action: PayloadAction<Record<string, boolean>>) => {
      state.features = { ...state.features, ...action.payload };
    },

    // Utility actions
    resetUI: (state) => {
      return { ...initialState, theme: state.theme, features: state.features };
    },
  },
});

export const {
  // Layout
  setSidebarOpen,
  toggleSidebar,
  setCommentsPanelOpen,
  toggleCommentsPanel,
  setCurrentView,

  // Modals
  openModal,
  closeModal,
  closeAllModals,
  removeModal,

  // Notifications
  addNotification,
  hideNotification,
  removeNotification,
  clearNotifications,

  // Loading
  setGlobalLoading,
  setLoading,
  clearLoading,

  // Navigation
  setBreadcrumbs,
  addBreadcrumb,
  clearBreadcrumbs,

  // Theme
  setTheme,
  setCompactMode,

  // Search
  setGlobalSearch,
  clearGlobalSearch,

  // Errors
  setError,
  clearError,
  clearAllErrors,

  // Features
  setFeature,
  setFeatures,

  // Utility
  resetUI,
} = uiSlice.actions;

export default uiSlice.reducer;

// Selectors
export const selectIsLoading = (state: { ui: UIState }, key: string) =>
  state.ui.loadingStates[key] || false;

export const selectVisibleNotifications = (state: { ui: UIState }) =>
  state.ui.notifications.filter((n) => n.isVisible);

export const selectOpenModals = (state: { ui: UIState }) =>
  state.ui.modals.filter((m) => m.isOpen);

export const selectFeatureEnabled = (state: { ui: UIState }, feature: string) =>
  state.ui.features[feature] || false;
