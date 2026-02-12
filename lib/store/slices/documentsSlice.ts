// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import { createBrowserClient } from "@/lib/supabase"
import { createClient } from "@/lib/supabase/client"
import {
  mapSupabaseCommentRowToDocumentComment,
  mapSupabaseDocumentRowToDocument,
  mapSupabaseDocumentRowsToDocuments,
  parseSupabaseDocumentCommentRow,
  parseSupabaseDocumentRow,
  parseSupabaseDocumentRows,
} from "@/lib/store/mappers/documentMapper"

export interface DocumentSection {
  id: string
  documentId: string
  title: string
  content: string
  order: number
  isLocked: boolean
  lockedBy?: string
  lockedAt?: string
  version: number
  createdAt: string
  updatedAt: string
}

export interface DocumentComment {
  id: string
  documentId: string
  sectionId?: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  position?: {
    x: number
    y: number
  }
  isResolved: boolean
  parentId?: string
  createdAt: string
  updatedAt: string
}

export interface DocumentVersion {
  id: string
  documentId: string
  version: number
  title: string
  changes: string
  createdBy: string
  createdAt: string
}

export interface Document {
  id: string
  title: string
  description?: string
  projectId: string
  teamId: string
  ownerId: string
  ownerName: string
  status: "draft" | "review" | "approved" | "published"
  type: "ind" | "protocol" | "report" | "other"
  dueDate?: string
  lastModified: string
  activeUsers: number
  version: number
  isTemplate: boolean
  sections: DocumentSection[]
  comments: DocumentComment[]
  versions: DocumentVersion[]
  permissions: {
    canEdit: boolean
    canComment: boolean
    canView: boolean
  }
  metadata?: {
    wordCount?: number
    pageCount?: number
    language?: string
    tags?: string[]
  }
}

export interface SectionLock {
  sectionId: string
  userId: string
  userName: string
  lockedAt: string
  expiresAt: string
}

interface DocumentsState {
  documents: Document[]
  currentDocument: Document | null
  currentSection: DocumentSection | null
  sectionLocks: SectionLock[]
  isLoading: boolean
  error: string | null
  selectedDocumentId: string | null
  editingSection: string | null
  commentsVisible: boolean
}

const initialState: DocumentsState = {
  documents: [],
  currentDocument: null,
  currentSection: null,
  sectionLocks: [],
  isLoading: false,
  error: null,
  selectedDocumentId: null,
  editingSection: null,
  commentsVisible: true,
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "Unknown error"
}

// Async thunks
export const fetchDocuments = createAsyncThunk(
  "documents/fetchDocuments",
  async (projectId: string | undefined, { rejectWithValue }) => {
    try {
      const supabase = createBrowserClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any).from("documents").select(`
        *,
        profiles!documents_owner_id_fkey ( name )
      `)
      if (projectId) query = query.eq("project_id", projectId)
      const { data, error } = await query.order("updated_at", { ascending: false })
      if (error) throw error
      const rawDocuments = parseSupabaseDocumentRows(data ?? [])
      return mapSupabaseDocumentRowsToDocuments(rawDocuments)
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error) || "Failed to fetch documents")
    }
  },
)

export const fetchDocumentDetails = createAsyncThunk(
  "documents/fetchDocumentDetails",
  async (documentId: string, { rejectWithValue }) => {
    try {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("documents")
        .select(`
          *,
          profiles!documents_owner_id_fkey ( name )
        `)
        .eq("id", documentId)
        .single()
      if (error) throw error
      return mapSupabaseDocumentRowToDocument(
        parseSupabaseDocumentRow(data),
      )
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error) || "Failed to fetch document details")
    }
  },
)

export const lockSection = createAsyncThunk(
  "documents/lockSection",
  async ({ sectionId, userId }: { sectionId: string; userId: string }, { rejectWithValue }) => {
    try {
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

      // document_sections table missing; skip locking logic
      return { sectionId, userId, expiresAt: expiresAt.toISOString() }
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error) || "Failed to lock section")
    }
  },
)

export const unlockSection = createAsyncThunk(
  "documents/unlockSection",
  async (sectionId: string, { rejectWithValue }) => {
    void sectionId;
    return rejectWithValue("document_sections table not available")
  },
)

export const updateSectionContent = createAsyncThunk(
  "documents/updateSectionContent",
  async ({ sectionId, content }: { sectionId: string; content: string }, { rejectWithValue }) => {
    void sectionId;
    void content;
    return rejectWithValue("document_sections table not available")
  },
)

export const addComment = createAsyncThunk(
  "documents/addComment",
  async (
    {
      sectionId,
      content,
      position,
    }: {
      sectionId?: string
      content: string
      position?: { x: number; y: number }
    },
    { rejectWithValue, getState },
  ) => {
    try {
      const supabase = createClient()
      const state = getState() as { auth: { user: { id: string } | null } }
      const userId = state.auth.user?.id

      if (!userId) throw new Error("User not authenticated")

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("document_comments")
        .insert({
          section_id: sectionId,
          user_id: userId,
          content,
          position,
        })
        .select(`
          *,
          profiles (
            name,
            avatar_url
          )
        `)
        .single()

      if (error) throw error

      return mapSupabaseCommentRowToDocumentComment(
        parseSupabaseDocumentCommentRow(data),
      )
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error) || "Failed to add comment")
    }
  },
)

export const resolveComment = createAsyncThunk(
  "documents/resolveComment",
  async (commentId: string, { rejectWithValue }) => {
    try {
      const supabase = createClient()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("document_comments").update({ is_resolved: true }).eq("id", commentId)

      if (error) throw error

      return commentId
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error) || "Failed to resolve comment")
    }
  },
)

export const fetchUserDocuments = createAsyncThunk(
  "documents/fetchUserDocuments",
  async (userId: string, { rejectWithValue }) => {
    try {
      const supabase = createClient()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: documents, error } = await (supabase as any)
        .from("documents")
        .select(`
          *,
          document_comments (
            id,
            section_id,
            user_id,
            content,
            position,
            is_resolved,
            parent_id,
            created_at,
            updated_at,
            profiles (
              name,
              avatar_url
            )
          ),
          profiles!documents_owner_id_fkey (
            name
          )
        `)
        .eq("owner_id", userId)
        .order("updated_at", { ascending: false })

      if (error) throw error

      const rawDocuments = parseSupabaseDocumentRows(documents ?? [])
      return mapSupabaseDocumentRowsToDocuments(rawDocuments)
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error) || "Failed to fetch user documents")
    }
  },
)

const documentsSlice = createSlice({
  name: "documents",
  initialState,
  reducers: {
    setCurrentDocument: (state, action: PayloadAction<Document | null>) => {
      state.currentDocument = action.payload
      state.selectedDocumentId = action.payload?.id || null
    },
    setSelectedDocumentId: (state, action: PayloadAction<string | null>) => {
      state.selectedDocumentId = action.payload
      state.currentDocument = state.documents.find((doc) => doc.id === action.payload) || null
    },
    hydrateSelectedDocumentFromStorage: (state) => {
      const saved = typeof window !== "undefined" ? localStorage.getItem("selectedDocumentId") : null
      state.selectedDocumentId = saved ?? null
    },
    setCurrentSection: (state, action: PayloadAction<DocumentSection | null>) => {
      state.currentSection = action.payload
    },
    setEditingSection: (state, action: PayloadAction<string | null>) => {
      state.editingSection = action.payload
    },
    setCommentsVisible: (state, action: PayloadAction<boolean>) => {
      state.commentsVisible = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    updateSectionLocally: (state, action: PayloadAction<{ sectionId: string; content: string }>) => {
      if (state.currentDocument) {
        const section = state.currentDocument.sections.find((s) => s.id === action.payload.sectionId)
        if (section) {
          section.content = action.payload.content
          section.updatedAt = new Date().toISOString()
        }
      }
    },
    addSectionLock: (state, action: PayloadAction<SectionLock>) => {
      const existingIndex = state.sectionLocks.findIndex((lock) => lock.sectionId === action.payload.sectionId)
      if (existingIndex !== -1) {
        state.sectionLocks[existingIndex] = action.payload
      } else {
        state.sectionLocks.push(action.payload)
      }
    },
    removeSectionLock: (state, action: PayloadAction<string>) => {
      state.sectionLocks = state.sectionLocks.filter((lock) => lock.sectionId !== action.payload)
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch documents
      .addCase(fetchDocuments.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.isLoading = false
        state.documents = action.payload

        if (state.selectedDocumentId) {
          state.currentDocument =
            state.documents.find((doc) => doc.id === state.selectedDocumentId) || null

          if (!state.currentDocument && state.documents.length > 0) {
            state.currentDocument = state.documents[0]
            state.selectedDocumentId = state.documents[0].id
          }
        } else if (state.documents.length > 0) {
          state.currentDocument = state.documents[0]
          state.selectedDocumentId = state.documents[0].id
        }
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Fetch document details
      .addCase(fetchDocumentDetails.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchDocumentDetails.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentDocument = action.payload
        state.selectedDocumentId = action.payload.id

        // Update document in documents array
        const index = state.documents.findIndex((doc) => doc.id === action.payload.id)
        if (index !== -1) {
          state.documents[index] = action.payload
        }
      })
      .addCase(fetchDocumentDetails.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Lock section
      .addCase(lockSection.fulfilled, (state) => {
        // document_sections table missing; no-op
        state.sectionLocks = []
      })
      .addCase(unlockSection.fulfilled, (state) => {
        // document_sections table missing; no-op
        state.sectionLocks = []
      })
      // Update section content
      .addCase(updateSectionContent.fulfilled, (state) => {
        // document_sections table missing; no-op
        void state
      })
      // Add comment
      .addCase(addComment.fulfilled, (state, action) => {
        if (state.currentDocument) {
          state.currentDocument.comments.push(action.payload)
        }
      })
      // Resolve comment
      .addCase(resolveComment.fulfilled, (state, action) => {
        if (state.currentDocument) {
          const comment = state.currentDocument.comments.find((c) => c.id === action.payload)
          if (comment) {
            comment.isResolved = true
          }
        }
      })
      // Fetch user documents
      .addCase(fetchUserDocuments.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchUserDocuments.fulfilled, (state, action) => {
        state.isLoading = false
        state.documents = action.payload

        if (state.selectedDocumentId) {
          state.currentDocument =
            state.documents.find((doc) => doc.id === state.selectedDocumentId) || null

          if (!state.currentDocument && state.documents.length > 0) {
            state.currentDocument = state.documents[0]
            state.selectedDocumentId = state.documents[0].id
          }
        } else if (state.documents.length > 0) {
          state.currentDocument = state.documents[0]
          state.selectedDocumentId = state.documents[0].id
        }
      })
      .addCase(fetchUserDocuments.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const {
  setCurrentDocument,
  setSelectedDocumentId,
  hydrateSelectedDocumentFromStorage,
  setCurrentSection,
  setEditingSection,
  setCommentsVisible,
  clearError,
  updateSectionLocally,
  addSectionLock,
  removeSectionLock,
} = documentsSlice.actions

export default documentsSlice.reducer
