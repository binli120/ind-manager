import type { NotificationItem } from "@/lib/store/slices/notificationsSlice";
import { z } from "zod";

export type NotificationEvent = {
  id: string;
  type?: string | null;
  title?: string | null;
  body?: string | null;
  resource_type?: string | null;
  resource_id?: string | null;
  action_url?: string | null;
  severity?: string | null;
  created_at?: string | null;
  creator?: { name?: string | null } | null;
};

export type NotificationRecipient = {
  id: string;
  user_id: string;
  notification_id?: string | null;
  is_read: boolean;
  is_dismissed?: boolean;
  is_acknowledged?: boolean;
  created_at?: string | null;
  read_at?: string | null;
  notification?: NotificationEvent | null;
};

export const notificationEventSchema: z.ZodType<NotificationEvent> = z
  .object({
    id: z.string(),
    type: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    body: z.string().nullable().optional(),
    resource_type: z.string().nullable().optional(),
    resource_id: z.string().nullable().optional(),
    action_url: z.string().nullable().optional(),
    severity: z.string().nullable().optional(),
    created_at: z.string().nullable().optional(),
    creator: z
      .object({
        name: z.string().nullable().optional(),
      })
      .nullable()
      .optional(),
  })
  .passthrough();

export const notificationRecipientSchema: z.ZodType<NotificationRecipient> = z
  .object({
    id: z.string(),
    user_id: z.string(),
    notification_id: z.string().nullable().optional(),
    is_read: z.boolean(),
    is_dismissed: z.boolean().optional(),
    is_acknowledged: z.boolean().optional(),
    created_at: z.string().nullable().optional(),
    read_at: z.string().nullable().optional(),
    notification: notificationEventSchema.nullable().optional(),
  })
  .passthrough();

export const notificationRecipientsSchema = z.array(notificationRecipientSchema);

export const mapNotificationRecipientToItem = (
  row: NotificationRecipient,
): NotificationItem => ({
  id: row.id,
  event_id: row.notification?.id ?? "",
  type: row.notification?.type ?? "unknown",
  title: row.notification?.title ?? null,
  body: row.notification?.body ?? null,
  resource_type: row.notification?.resource_type ?? null,
  resource_id: row.notification?.resource_id ?? null,
  action_url: row.notification?.action_url ?? null,
  severity: row.notification?.severity ?? null,
  from: row.notification?.creator?.name ?? null,
  is_read: row.is_read,
  is_dismissed: row.is_dismissed ?? false,
  is_acknowledged: row.is_acknowledged ?? false,
  created_at:
    row.notification?.created_at ??
    row.created_at ??
    new Date().toISOString(),
});

export const mapNotificationRecipientsToItems = (
  rows: NotificationRecipient[],
): NotificationItem[] => rows.map(mapNotificationRecipientToItem);

export const parseNotificationRecipients = (value: unknown) =>
  notificationRecipientsSchema.parse(value);

export const countUnreadNotifications = (items: NotificationItem[]) =>
  items.filter((item) => !item.is_read).length;
