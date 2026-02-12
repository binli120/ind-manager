import type { NotificationItem } from "@/lib/store/slices/notificationsSlice";

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
  created_at?: string | null;
  read_at?: string | null;
  notification?: NotificationEvent | null;
};

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
  created_at:
    row.notification?.created_at ??
    row.created_at ??
    new Date().toISOString(),
});

export const mapNotificationRecipientsToItems = (
  rows: NotificationRecipient[],
): NotificationItem[] => rows.map(mapNotificationRecipientToItem);

export const countUnreadNotifications = (items: NotificationItem[]) =>
  items.filter((item) => !item.is_read).length;
