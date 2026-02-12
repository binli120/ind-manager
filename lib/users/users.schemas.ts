import { z } from "zod";

export const tenantRefSchema = z
  .object({
    name: z.string().nullable().optional(),
  })
  .passthrough();

export const userSelectRowSchema = z
  .object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string(),
    phone: z.string().nullable(),
    submission_role: z.string(),
    status: z.string().nullable(),
    tenantid: z.string().nullable(),
    tenants: tenantRefSchema.nullable().optional(),
  })
  .passthrough();

export const userSelectRowsSchema = z.array(userSelectRowSchema);

export const userProjectIdRowSchema = z.object({
  project_id: z.string().nullable(),
});

export const userProjectIdRowsSchema = z.array(userProjectIdRowSchema);
