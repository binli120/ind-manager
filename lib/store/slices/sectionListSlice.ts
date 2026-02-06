// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { requestPdfAnalysisApi } from "@/lib/store/api/pdfAnalysisApi"

export interface SectionListPayload {
  count?: number
  sections?: unknown[]
}

export interface SectionListState {
  data: SectionListPayload | null
  loading: boolean
  error: string | null
  fetchedAt?: number
}

const initialState: SectionListState = {
  data: null,
  loading: false,
  error: null,
}

export const fetchSectionList = createAsyncThunk<SectionListPayload, { userId: string }>(
  "sectionList/fetch",
  async ({ userId }, { rejectWithValue }) => {
    try {
      const resp = await requestPdfAnalysisApi<SectionListPayload>({
        path: "/ncd/sectionList",
        method: "GET",
        headers: { "user-id": userId },
        userIdHeader: userId,
        allowRedirects: false,
        suppressErrorLog: true,
      })
      return resp
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
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSectionList.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSectionList.fulfilled, (state, action: PayloadAction<SectionListPayload>) => {
        state.loading = false
        state.data = action.payload ?? { sections: [] }
        state.fetchedAt = Date.now()
      })
      .addCase(fetchSectionList.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) ?? "Failed to load section list"
      })
  },
})

export const { clearSectionList } = sectionListSlice.actions
export default sectionListSlice.reducer
