import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// Slice reducers
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/lib/store/slices/authSlice';
import pageReducer from '@/lib/store/slices/pageSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    page: pageReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAuthUser = () => useAppSelector(s => s.auth.user);
export const useIsAuthenticated = () => useAppSelector(s => s.auth.isAuthenticated);
export const useAuthLoading = () => useAppSelector(s => s.auth.loading);
