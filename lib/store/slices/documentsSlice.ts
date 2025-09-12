import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import { createClient } from "@/lib/supabase/client"

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

// Async thunks
export const fetchDocuments = createAsyncThunk(
  "documents/fetchDocuments",
  async (projectId?: string, { rejectWithValue }) => {
    try {
      const supabase = createClient()

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

      const transformedDocuments: Document[] =
        documents?.map((doc: any) => ({
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
            doc.document_sections?.map((section: any) => ({
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
            doc.document_comments?.map((comment: any) => ({
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
        })) || []

      return transformedDocuments
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch documents")
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

      const transformedDocument: Document = {
        id: document.id,
        title: document.title,
        description: document.description,
        projectId: document.project_id,
        teamId: document.team_id,
        ownerId: document.owner_id,
        ownerName: document.profiles?.name || "Unknown User",
        status: document.status,
        type: document.type,
        dueDate: document.due_date,
        lastModified: document.updated_at,
        activeUsers: document.active_users || 0,
        version: document.version || 1,
        isTemplate: document.is_template || false,
        sections:
          document.document_sections
            ?.map((section: any) => ({
              id: section.id,
              documentId: document.id,
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
            .sort((a: any, b: any) => a.order - b.order) || [],
        comments:
          document.document_comments?.map((comment: any) => ({
            id: comment.id,
            documentId: document.id,
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
          document.document_versions?.map((version: any) => ({
            id: version.id,
            documentId: document.id,
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
        metadata: document.metadata,
      }

      return transformedDocument
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch document details")
    }
  },
)

export const lockSection = createAsyncThunk(
  "documents/lockSection",
  async ({ sectionId, userId }: { sectionId: string; userId: string }, { rejectWithValue }) => {
    try {
      const supabase = createClient()

      const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

      const { data, error } = await supabase
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
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to lock section")
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
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to unlock section")
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
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update section content")
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
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add comment")
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
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to resolve comment")
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

      const transformedDocuments: Document[] =
        documents?.map((doc: any) => ({
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
            doc.document_sections?.map((section: any) => ({
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
            doc.document_comments?.map((comment: any) => ({
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
        })) || []

      return transformedDocuments
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch user documents")
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
      })
      .addCase(fetchUserDocuments.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const {
  setCurrentDocument,
  setCurrentSection,
  setEditingSection,
  setCommentsVisible,
  clearError,
  updateSectionLocally,
  addSectionLock,
  removeSectionLock,
} = documentsSlice.actions

export default documentsSlice.reducer
