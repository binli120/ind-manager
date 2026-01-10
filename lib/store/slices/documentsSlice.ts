// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import { createBrowserClient } from "@/lib/supabase"

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

type SupabaseProfileRow = {
  name?: string | null
  avatar_url?: string | null
}

type SupabaseDocumentSectionRow = {
  id: string
  title: string
  content?: string | null
  order_index: number
  is_locked?: boolean | null
  locked_by?: string | null
  locked_at?: string | null
  version?: number | null
  created_at: string
  updated_at: string
}

type SupabaseDocumentCommentRow = {
  id: string
  section_id?: string | null
  user_id: string
  content: string
  position?: DocumentComment["position"] | null
  is_resolved?: boolean | null
  parent_id?: string | null
  created_at: string
  updated_at: string
  profiles?: SupabaseProfileRow | null
}

type SupabaseDocumentVersionRow = {
  id: string
  version: number
  title: string
  changes: string
  created_by: string
  created_at: string
}

type SupabaseDocumentRow = {
  id: string
  title: string
  description?: string | null
  project_id: string
  team_id: string
  owner_id: string
  status: Document["status"]
  type: Document["type"]
  due_date?: string | null
  updated_at: string
  active_users?: number | null
  version?: number | null
  is_template?: boolean | null
  document_sections?: SupabaseDocumentSectionRow[] | null
  document_comments?: SupabaseDocumentCommentRow[] | null
  document_versions?: SupabaseDocumentVersionRow[] | null
  profiles?: SupabaseProfileRow | null
  metadata?: Document["metadata"] | null
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
  async (projectId?: string, { rejectWithValue }) => {
    try {
    const supabase = createBrowserClient()

      let query = supabase.from("documents").select(`
          *,
          document_sections (
            id,
            title,
            content,
            order_index,
            is_locked,
            locked_by,
            locked_at,
            version,
            created_at,
            updated_at
          ),
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

      if (projectId) {
        query = query.eq("project_id", projectId)
      }

      const { data: documents, error } = await query.order("updated_at", { ascending: false })

      if (error) throw error

      const rawDocuments = (documents ?? []) as SupabaseDocumentRow[]
      const transformedDocuments: Document[] =
        rawDocuments.map((doc) => ({
          id: doc.id,
          title: doc.title,
          description: doc.description,
          projectId: doc.project_id,
          teamId: doc.team_id,
          ownerId: doc.owner_id,
          ownerName: doc.profiles?.name || "Unknown User",
          status: doc.status,
          type: doc.type,
          dueDate: doc.due_date,
          lastModified: doc.updated_at,
          activeUsers: doc.active_users || 0,
          version: doc.version || 1,
          isTemplate: doc.is_template || false,
          sections:
            doc.document_sections?.map((section) => ({
              id: section.id,
              documentId: doc.id,
              title: section.title,
              content: section.content || "",
              order: section.order_index,
              isLocked: section.is_locked || false,
              lockedBy: section.locked_by,
              lockedAt: section.locked_at,
              version: section.version || 1,
              createdAt: section.created_at,
              updatedAt: section.updated_at,
            })) || [],
          comments:
            doc.document_comments?.map((comment) => ({
              id: comment.id,
              documentId: doc.id,
              sectionId: comment.section_id,
              userId: comment.user_id,
              userName: comment.profiles?.name || "Unknown User",
              userAvatar: comment.profiles?.avatar_url,
              content: comment.content,
              position: comment.position,
              isResolved: comment.is_resolved || false,
              parentId: comment.parent_id,
              createdAt: comment.created_at,
              updatedAt: comment.updated_at,
            })) || [],
          versions: [],
          permissions: {
            canEdit: true, // TODO: Calculate based on user permissions
            canComment: true,
            canView: true,
          },
          metadata: doc.metadata,
        }))

      return transformedDocuments
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

      const { data: document, error } = await supabase
        .from("documents")
        .select(`
          *,
          document_sections (
            id,
            title,
            content,
            order_index,
            is_locked,
            locked_by,
            locked_at,
            version,
            created_at,
            updated_at
          ),
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
          document_versions (
            id,
            version,
            title,
            changes,
            created_by,
            created_at
          ),
          profiles!documents_owner_id_fkey (
            name
          )
        `)
        .eq("id", documentId)
        .single()

      if (error) throw error

      const rawDocument = document as SupabaseDocumentRow
      const transformedDocument: Document = {
        id: rawDocument.id,
        title: rawDocument.title,
        description: rawDocument.description ?? undefined,
        projectId: rawDocument.project_id,
        teamId: rawDocument.team_id,
        ownerId: rawDocument.owner_id,
        ownerName: rawDocument.profiles?.name || "Unknown User",
        status: rawDocument.status,
        type: rawDocument.type,
        dueDate: rawDocument.due_date ?? undefined,
        lastModified: rawDocument.updated_at,
        activeUsers: rawDocument.active_users || 0,
        version: rawDocument.version || 1,
        isTemplate: rawDocument.is_template || false,
        sections:
          rawDocument.document_sections
            ?.map((section) => ({
              id: section.id,
              documentId: rawDocument.id,
              title: section.title,
              content: section.content || "",
              order: section.order_index,
              isLocked: section.is_locked || false,
              lockedBy: section.locked_by,
              lockedAt: section.locked_at,
              version: section.version || 1,
              createdAt: section.created_at,
              updatedAt: section.updated_at,
            }))
            .sort((a, b) => a.order - b.order) || [],
        comments:
          rawDocument.document_comments?.map((comment) => ({
            id: comment.id,
            documentId: rawDocument.id,
            sectionId: comment.section_id,
            userId: comment.user_id,
            userName: comment.profiles?.name || "Unknown User",
            userAvatar: comment.profiles?.avatar_url,
            content: comment.content,
            position: comment.position,
            isResolved: comment.is_resolved || false,
            parentId: comment.parent_id,
            createdAt: comment.created_at,
            updatedAt: comment.updated_at,
          })) || [],
        versions:
          rawDocument.document_versions?.map((version) => ({
            id: version.id,
            documentId: rawDocument.id,
            version: version.version,
            title: version.title,
            changes: version.changes,
            createdBy: version.created_by,
            createdAt: version.created_at,
          })) || [],
        permissions: {
          canEdit: true, // TODO: Calculate based on user permissions
          canComment: true,
          canView: true,
        },
        metadata: rawDocument.metadata ?? undefined,
      }

      return transformedDocument
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error) || "Failed to fetch document details")
    }
  },
)

export const lockSection = createAsyncThunk(
  "documents/lockSection",
  async ({ sectionId, userId }: { sectionId: string; userId: string }, { rejectWithValue }) => {
    try {
      const supabase = createClient()

      const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

      const { error } = await supabase
        .from("document_sections")
        .update({
          is_locked: true,
          locked_by: userId,
          locked_at: new Date().toISOString(),
        })
        .eq("id", sectionId)
        .select()
        .single()

      if (error) throw error

      return { sectionId, userId, expiresAt: expiresAt.toISOString() }
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error) || "Failed to lock section")
    }
  },
)

export const unlockSection = createAsyncThunk(
  "documents/unlockSection",
  async (sectionId: string, { rejectWithValue }) => {
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("document_sections")
        .update({
          is_locked: false,
          locked_by: null,
          locked_at: null,
        })
        .eq("id", sectionId)

      if (error) throw error

      return sectionId
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error) || "Failed to unlock section")
    }
  },
)

export const updateSectionContent = createAsyncThunk(
  "documents/updateSectionContent",
  async ({ sectionId, content }: { sectionId: string; content: string }, { rejectWithValue }) => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("document_sections")
        .update({
          content,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sectionId)
        .select()
        .single()

      if (error) throw error

      return { sectionId, content, updatedAt: data.updated_at }
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error) || "Failed to update section content")
    }
  },
)

export const addComment = createAsyncThunk(
  "documents/addComment",
  async (
    {
      documentId,
      sectionId,
      content,
      position,
    }: {
      documentId: string
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

      const { data, error } = await supabase
        .from("document_comments")
        .insert({
          document_id: documentId,
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

      const comment: DocumentComment = {
        id: data.id,
        documentId: data.document_id,
        sectionId: data.section_id,
        userId: data.user_id,
        userName: data.profiles?.name || "Unknown User",
        userAvatar: data.profiles?.avatar_url,
        content: data.content,
        position: data.position,
        isResolved: data.is_resolved || false,
        parentId: data.parent_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }

      return comment
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

      const { error } = await supabase.from("document_comments").update({ is_resolved: true }).eq("id", commentId)

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

      const { data: documents, error } = await supabase
        .from("documents")
        .select(`
          *,
          document_sections (
            id,
            title,
            content,
            order_index,
            is_locked,
            locked_by,
            locked_at,
            version,
            created_at,
            updated_at
          ),
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

      const rawDocuments = (documents ?? []) as SupabaseDocumentRow[]
      const transformedDocuments: Document[] =
        rawDocuments.map((doc) => ({
          id: doc.id,
          title: doc.title,
          description: doc.description,
          projectId: doc.project_id,
          teamId: doc.team_id,
          ownerId: doc.owner_id,
          ownerName: doc.profiles?.name || "Unknown User",
          status: doc.status,
          type: doc.type,
          dueDate: doc.due_date,
          lastModified: doc.updated_at,
          activeUsers: doc.active_users || 0,
          version: doc.version || 1,
          isTemplate: doc.is_template || false,
          sections:
            doc.document_sections?.map((section) => ({
              id: section.id,
              documentId: doc.id,
              title: section.title,
              content: section.content || "",
              order: section.order_index,
              isLocked: section.is_locked || false,
              lockedBy: section.locked_by,
              lockedAt: section.locked_at,
              version: section.version || 1,
              createdAt: section.created_at,
              updatedAt: section.updated_at,
            })) || [],
          comments:
            doc.document_comments?.map((comment) => ({
              id: comment.id,
              documentId: doc.id,
              sectionId: comment.section_id,
              userId: comment.user_id,
              userName: comment.profiles?.name || "Unknown User",
              userAvatar: comment.profiles?.avatar_url,
              content: comment.content,
              position: comment.position,
              isResolved: comment.is_resolved || false,
              parentId: comment.parent_id,
              createdAt: comment.created_at,
              updatedAt: comment.updated_at,
            })) || [],
          versions: [],
          permissions: {
            canEdit: true, // TODO: Calculate based on user permissions
            canComment: true,
            canView: true,
          },
          metadata: doc.metadata,
        }))

      return transformedDocuments
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
      .addCase(lockSection.fulfilled, (state, action) => {
        if (state.currentDocument) {
          const section = state.currentDocument.sections.find((s) => s.id === action.payload.sectionId)
          if (section) {
            section.isLocked = true
            section.lockedBy = action.payload.userId
            section.lockedAt = new Date().toISOString()
          }
        }
      })
      // Unlock section
      .addCase(unlockSection.fulfilled, (state, action) => {
        if (state.currentDocument) {
          const section = state.currentDocument.sections.find((s) => s.id === action.payload)
          if (section) {
            section.isLocked = false
            section.lockedBy = undefined
            section.lockedAt = undefined
          }
        }
        state.sectionLocks = state.sectionLocks.filter((lock) => lock.sectionId !== action.payload)
      })
      // Update section content
      .addCase(updateSectionContent.fulfilled, (state, action) => {
        if (state.currentDocument) {
          const section = state.currentDocument.sections.find((s) => s.id === action.payload.sectionId)
          if (section) {
            section.content = action.payload.content
            section.updatedAt = action.payload.updatedAt
          }
        }
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
