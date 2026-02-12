import type {
  Document,
  DocumentComment,
} from "@/lib/store/slices/documentsSlice";

export type SupabaseProfileRow = {
  name?: string | null;
  avatar_url?: string | null;
};

export type SupabaseDocumentCommentRow = {
  id: string;
  section_id?: string | null;
  user_id: string;
  content: string;
  position?: DocumentComment["position"] | null;
  is_resolved?: boolean | null;
  parent_id?: string | null;
  created_at: string;
  updated_at: string;
  profiles?: SupabaseProfileRow | null;
  document_id?: string | null;
};

export type SupabaseDocumentRow = {
  id: string;
  title: string;
  description?: string | null;
  project_id: string;
  team_id: string;
  owner_id: string;
  status: Document["status"];
  type: Document["type"];
  due_date?: string | null;
  updated_at: string;
  active_users?: number | null;
  version?: number | null;
  is_template?: boolean | null;
  profiles?: SupabaseProfileRow | null;
  metadata?: Document["metadata"] | null;
};

const DOCUMENT_DEFAULT_PERMISSIONS: Document["permissions"] = {
  canEdit: true,
  canComment: true,
  canView: true,
};

export const mapSupabaseDocumentRowToDocument = (
  row: SupabaseDocumentRow,
): Document => ({
  id: row.id,
  title: row.title,
  description: row.description ?? undefined,
  projectId: row.project_id,
  teamId: row.team_id,
  ownerId: row.owner_id,
  ownerName: row.profiles?.name || "Unknown User",
  status: row.status,
  type: row.type,
  dueDate: row.due_date ?? "",
  lastModified: row.updated_at ?? "",
  activeUsers: row.active_users || 0,
  version: row.version || 1,
  isTemplate: row.is_template || false,
  metadata: row.metadata ?? undefined,
  sections: [],
  comments: [],
  versions: [],
  permissions: DOCUMENT_DEFAULT_PERMISSIONS,
});

export const mapSupabaseDocumentRowsToDocuments = (
  rows: SupabaseDocumentRow[],
) => rows.map(mapSupabaseDocumentRowToDocument);

export const mapSupabaseCommentRowToDocumentComment = (
  row: SupabaseDocumentCommentRow,
): DocumentComment => ({
  id: row.id,
  documentId: row.document_id ?? "",
  sectionId: row.section_id ?? undefined,
  userId: row.user_id,
  userName: row.profiles?.name || "Unknown User",
  userAvatar: row.profiles?.avatar_url ?? undefined,
  content: row.content ?? "",
  position: row.position ?? undefined,
  isResolved: row.is_resolved || false,
  parentId: row.parent_id ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
