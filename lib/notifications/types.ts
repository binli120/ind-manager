import { z } from "zod";

export enum NotificationRecipientAction {
  Read = "read",
  Dismiss = "dismiss",
  Acknowledge = "acknowledge",
  Restore = "restore",
}

export const notificationRecipientActionSchema = z.nativeEnum(
  NotificationRecipientAction,
);

export const notificationScopeSchema = z.enum(["system", "project", "user"]);
export const notificationSourceTypeSchema = z.enum([
  "manual",
  "mention",
  "system_writer",
]);

export const notificationTypeSchema = z.enum([
  "document_comment",
  "task_assignment",
  "deadline_reminder",
  "system_alert",
]);

export const notificationChannelsSchema = z.object({
  inApp: z.boolean().default(true),
  email: z.boolean().default(false),
});

export const dispatchNotificationRequestSchema = z
  .object({
    scope: notificationScopeSchema,
    sourceType: notificationSourceTypeSchema.default("manual"),
    type: notificationTypeSchema.default("system_alert"),
    title: z.string().trim().min(1).max(200),
    body: z.string().trim().max(2000).optional(),
    actionUrl: z.string().trim().url().max(2000).optional(),
    severity: z.string().trim().max(24).optional(),
    resourceType: z.string().trim().max(80).optional(),
    resourceId: z.string().trim().max(128).optional(),
    projectId: z.string().uuid().optional(),
    targetUserIds: z.array(z.string().uuid()).max(200).optional(),
    targetHandles: z.array(z.string().trim().min(1).max(64)).max(200).optional(),
    target: z.string().trim().max(500).optional(),
    context: z.record(z.string(), z.unknown()).optional(),
    channels: notificationChannelsSchema.default({ inApp: true, email: false }),
    skipActor: z.boolean().default(true),
  })
  .superRefine((value, ctx) => {
    if (value.scope === "project" && !value.projectId) {
      ctx.addIssue({
        code: "custom",
        message: "projectId is required for project scope",
        path: ["projectId"],
      });
    }

    if (value.scope === "user") {
      const hasIds = Boolean(value.targetUserIds?.length);
      const hasHandles = Boolean(value.targetHandles?.length);
      const hasTarget = Boolean(value.target?.trim().length);
      if (!hasIds && !hasHandles && !hasTarget) {
        ctx.addIssue({
          code: "custom",
          message:
            "targetUserIds, targetHandles, or target is required for user scope",
          path: ["target"],
        });
      }
    }

    if (!value.channels.inApp && !value.channels.email) {
      ctx.addIssue({
        code: "custom",
        message: "At least one delivery channel must be enabled",
        path: ["channels"],
      });
    }
  });

export type DispatchNotificationRequest = z.infer<
  typeof dispatchNotificationRequestSchema
>;

export const mentionNotificationRequestSchema = z.object({
  content: z.string().trim().min(1).max(10000),
  title: z.string().trim().min(1).max(200).optional(),
  actionUrl: z.string().trim().url().max(2000).optional(),
  projectId: z.string().uuid().optional(),
  commentId: z.string().uuid().optional(),
  threadId: z.string().uuid().optional(),
  anchorId: z.string().uuid().optional(),
  documentVersionId: z.string().uuid().optional(),
  resourceId: z.string().trim().max(128).optional(),
  channels: notificationChannelsSchema.default({ inApp: true, email: false }),
});

export type MentionNotificationRequest = z.infer<
  typeof mentionNotificationRequestSchema
>;
