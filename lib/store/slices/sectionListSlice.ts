// Author: Bin Lee
// Email: binlee120@gmail.com
import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { getSectionListPayload } from "@/lib/section-list-mapping"

export interface SectionListPayload {
  count?: number
  sections?: unknown[]
}

export interface SectionListState {
  data: SectionListPayload | null
  loading: boolean
  error: string | null
  fetchedAt?: number
  attempts: number
}

const initialState: SectionListState = {
  data: null,
  loading: false,
  error: null,
  attempts: 0,
}

export const fetchSectionList = createAsyncThunk<SectionListPayload, { userId: string }>(
  "sectionList/fetch",
  async (_args, { rejectWithValue }) => {
    try {
      return getSectionListPayload()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load section list"
      return rejectWithValue(msg)
    }
  },
)

const sectionListSlice = createSlice({
  name: "sectionList",
  initialState,
  reducers: {
    clearSectionList(state) {
      state.data = null
      state.error = null
      state.fetchedAt = undefined
      state.attempts = 0
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSectionList.pending, (state) => {
        state.loading = true
        state.error = null
        state.attempts += 1
      })
      .addCase(fetchSectionList.fulfilled, (state, action: PayloadAction<SectionListPayload>) => {
        state.loading = false
        state.data = action.payload ?? { sections: [] }
        state.fetchedAt = Date.now()
        state.attempts = 0
      })
      .addCase(fetchSectionList.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) ?? "Failed to load section list"
      })
  },
})

export const { clearSectionList } = sectionListSlice.actions
export default sectionListSlice.reducer
