// Author: Bin Lee
// Email: binlee120@gmail.com
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PageState {
  currentPage?: string;
  pages: Record<string, unknown>;
}

const initialState: PageState = {
  currentPage: undefined,
  pages: {},
};

interface SetPageDataPayload<T = unknown> {
  key: string; // e.g., route path or page id
  data: T;
}

const pageSlice = createSlice({
  name: 'page',
  initialState,
  reducers: {
    setCurrentPage(state, action: PayloadAction<string | undefined>) {
      state.currentPage = action.payload;
    },
    setPageData(state, action: PayloadAction<SetPageDataPayload>) {
      const { key, data } = action.payload;
      state.pages[key] = data;
    },
    clearPageData(state, action: PayloadAction<string>) {
      delete state.pages[action.payload];
    },
    resetAll(state) {
      state.currentPage = undefined;
      state.pages = {};
    },
  },
});

export const { setCurrentPage, setPageData, clearPageData, resetAll } = pageSlice.actions;
export default pageSlice.reducer;
