import { z } from "zod";

export const projectFolderResponseSchema = z
  .object({
    ok: z.boolean().optional(),
    message: z.string().optional(),
    error: z.string().optional(),
  })
  .passthrough();

export const userTenantAndEmailRowSchema = z.object({
  tenantid: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
});

export const userProjectAssignmentRowSchema = z.object({
  project_id: z.string().nullable(),
  role: z.string().nullable().optional(),
});

// Minimal required shape for project rows before mapping into UI models.
export const projectRowSchema = z
  .object({
    id: z.string(),
    tenantid: z.string().nullable().optional(),
    ind_title: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .passthrough();

export const projectRowsSchema = z.array(projectRowSchema);

export const authUserSchema = z.object({
  id: z.string(),
});

export const authGetUserResponseSchema = z.object({
  data: z.object({
    user: authUserSchema.nullable(),
  }),
  error: z
    .object({
      message: z.string(),
    })
    .nullable(),
});
