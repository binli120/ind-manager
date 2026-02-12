import type {
  Document,
  DocumentComment,
} from "@/lib/store/slices/documentsSlice";
import { z } from "zod";

export type SupabaseProfileRow = {
  name?: string | null;
  avatar_url?: string | null;
};

export type SupabaseDocumentCommentRow = {
  id: string;
  section_id?: string | null;
  user_id: string;
  content: string | null;
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

const supabaseProfileRowSchema: z.ZodType<SupabaseProfileRow> = z.object({
  name: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
});

export const supabaseDocumentCommentRowSchema: z.ZodType<SupabaseDocumentCommentRow> =
  z.object({
    id: z.string(),
    section_id: z.string().nullable().optional(),
    user_id: z.string(),
    content: z.string().nullable(),
    position: z
      .object({
        x: z.number(),
        y: z.number(),
      })
      .nullable()
      .optional(),
    is_resolved: z.boolean().nullable().optional(),
    parent_id: z.string().nullable().optional(),
    created_at: z.string(),
    updated_at: z.string(),
    profiles: supabaseProfileRowSchema.nullable().optional(),
    document_id: z.string().nullable().optional(),
  });

export const supabaseDocumentRowSchema: z.ZodType<SupabaseDocumentRow> = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  project_id: z.string(),
  team_id: z.string(),
  owner_id: z.string(),
  status: z.enum(["draft", "review", "approved", "published"]),
  type: z.enum(["ind", "protocol", "report", "other"]),
  due_date: z.string().nullable().optional(),
  updated_at: z.string(),
  active_users: z.number().nullable().optional(),
  version: z.number().nullable().optional(),
  is_template: z.boolean().nullable().optional(),
  profiles: supabaseProfileRowSchema.nullable().optional(),
  metadata: z
    .object({
      wordCount: z.number().optional(),
      pageCount: z.number().optional(),
      language: z.string().optional(),
      tags: z.array(z.string()).optional(),
    })
    .nullable()
    .optional(),
});

export const supabaseDocumentRowsSchema = z.array(supabaseDocumentRowSchema);

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

export const parseSupabaseDocumentRow = (value: unknown): SupabaseDocumentRow =>
  supabaseDocumentRowSchema.parse(value);

export const parseSupabaseDocumentRows = (value: unknown): SupabaseDocumentRow[] =>
  supabaseDocumentRowsSchema.parse(value);

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

export const parseSupabaseDocumentCommentRow = (
  value: unknown,
): SupabaseDocumentCommentRow => supabaseDocumentCommentRowSchema.parse(value);
