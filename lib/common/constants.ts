// Author: Bin Lee
// Email: binlee120@gmail.com

/**
export const ALLOWED_VIEWS = new Set<ViewType>([
  'workspace', 'projects', ]);

export const getStoredView = (): ViewType | undefined => {
  if (typeof window === 'undefined') return;
  const v = localStorage.getItem('currentView');
  return v && ALLOWED_VIEWS.has(v as ViewType) ? v as ViewType : undefined;
};

// uiSlice.ts
const hydrateCurrentViewFromStorage = createAsyncThunk(
  'ui/hydrateCurrentView',
  async (_, { dispatch }) => {
    const view = getStoredView();
    if (view) dispatch(setCurrentView(view));
  }
);

// reducers
openModal: (state, action: PayloadAction<OpenModalPayload>) => {
  const existingIndex = state.modals.findIndex(m => m.id === action.payload.id);
  if (existingIndex !== -1) {
    state.modals[existingIndex] = { ...action.payload, isOpen: true };
  } else {
    state.modals.push({ ...action.payload, isOpen: true });
  }
},
 */
