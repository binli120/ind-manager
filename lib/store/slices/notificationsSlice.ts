// Author: Bin Lee
// Email: binlee120@gmail.com

import { NotificationRecipientAction } from "@/lib/notifications/types";
import {
  countUnreadNotifications,
  mapNotificationRecipientsToItems,
  type NotificationEvent,
  type NotificationRecipient,
  parseNotificationRecipients,
} from "@/lib/store/mappers/notificationMapper";
import { createClient } from "@/lib/supabase/client";
import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";

export type NotificationItem = {
  id: NotificationRecipient["id"];
  event_id: NotificationEvent["id"];
  type: NotificationEvent["type"];
  title: NotificationEvent["title"];
  body: NotificationEvent["body"];
  resource_type: NotificationEvent["resource_type"];
  resource_id: NotificationEvent["resource_id"];
  action_url: NotificationEvent["action_url"];
  severity: NotificationEvent["severity"];
  from: string | null;
  is_read: NotificationRecipient["is_read"];
  is_dismissed?: NotificationRecipient["is_dismissed"];
  is_acknowledged?: boolean;
  created_at: NotificationEvent["created_at"];
};

interface NotificationsState {
  items: NotificationItem[];
  unread: number;
  loading: boolean;
  error: string | null;
  isOpen: boolean;
}

const initialState: NotificationsState = {
  items: [],
  unread: 0,
  loading: false,
  error: null,
  isOpen: false,
};

export const fetchNotifications = createAsyncThunk<
  { items: NotificationItem[]; unread: number },
  { userId: string },
  { rejectValue: string }
>("notifications/fetchAll", async ({ userId }, { rejectWithValue }) => {
  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("notification_recipients")
    .select(
      `
      id,
      user_id,
      is_read,
      is_dismissed,
      created_at,
      notification:notification_id (
        id,
        type,
        title,
        body,
        resource_type,
        resource_id,
        action_url,
        severity,
        created_at,
        created_by,
        creator:created_by ( id, name )
      )
    `,
    )
    .eq("user_id", userId)
    .eq("is_dismissed", false)
    .order("created_at", { ascending: false });

  if (error) return rejectWithValue(error.message);

  const items = mapNotificationRecipientsToItems(
    parseNotificationRecipients(data ?? []),
  );
  const unread = countUnreadNotifications(items);
  return { items, unread };
});

export const markAsRead = createAsyncThunk<
  { id: string },
  { id: string },
  { rejectValue: string }
>("notifications/markAsRead", async ({ id }, { rejectWithValue }) => {
  const response = await fetch(`/api/notifications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: NotificationRecipientAction.Read }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    return rejectWithValue(
      (payload as { error?: string }).error ?? "Failed to mark as read",
    );
  }
  return { id };
});

export const acknowledgeNotification = createAsyncThunk<
  { id: string },
  { id: string },
  { rejectValue: string }
>("notifications/acknowledge", async ({ id }, { rejectWithValue }) => {
  const response = await fetch(`/api/notifications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: NotificationRecipientAction.Acknowledge }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    return rejectWithValue(
      (payload as { error?: string }).error ?? "Failed to confirm receipt",
    );
  }
  return { id };
});

export const dismissNotification = createAsyncThunk<
  { id: string },
  { id: string },
  { rejectValue: string }
>("notifications/dismiss", async ({ id }, { rejectWithValue }) => {
  const response = await fetch(`/api/notifications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: NotificationRecipientAction.Dismiss }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    return rejectWithValue(
      (payload as { error?: string }).error ?? "Failed to dismiss notification",
    );
  }
  return { id };
});

export const markAllAsRead = createAsyncThunk<
  void,
  { userId: string },
  { rejectValue: string }
>("notifications/markAllAsRead", async ({ userId }, { rejectWithValue }) => {
  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("notification_recipients")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .match({ user_id: userId, is_read: false });

  if (error) return rejectWithValue(error.message);
});

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    clearNotifications(state) {
      state.items = [];
      state.unread = 0;
    },
    setOpen(state, action: PayloadAction<boolean>) {
      state.isOpen = action.payload;
    },
  },
  extraReducers: (param) => {
    param.addCase(fetchNotifications.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    param.addCase(fetchNotifications.fulfilled, (s, a) => {
      s.loading = false;
      s.items = a.payload.items;
      s.unread = a.payload.unread;
    });
    param.addCase(fetchNotifications.rejected, (s, a) => {
      s.loading = false;
      s.error = (typeof a.payload === "string" ? a.payload : null) ??
        a.error.message ??
        "Failed to load notifications";
    });

    param.addCase(markAsRead.fulfilled, (s, a) => {
      const idx = s.items.findIndex((x) => x.id === a.payload.id);
      if (idx >= 0 && !s.items[idx].is_read) {
        s.items[idx].is_read = true;
        s.unread = Math.max(0, s.unread - 1);
      }
    });

    param.addCase(markAllAsRead.fulfilled, (s) => {
      s.items = s.items.map((n) => ({ ...n, is_read: true }));
      s.unread = 0;
    });
    param.addCase(acknowledgeNotification.fulfilled, (s, a) => {
      const idx = s.items.findIndex((x) => x.id === a.payload.id);
      if (idx >= 0 && !s.items[idx].is_read) {
        s.items[idx].is_read = true;
        s.items[idx].is_acknowledged = true;
        s.unread = Math.max(0, s.unread - 1);
      } else if (idx >= 0) {
        s.items[idx].is_acknowledged = true;
      }
    });
    param.addCase(dismissNotification.fulfilled, (s, a) => {
      const item = s.items.find((x) => x.id === a.payload.id);
      if (item && !item.is_read) {
        s.unread = Math.max(0, s.unread - 1);
      }
      s.items = s.items.filter((x) => x.id !== a.payload.id);
    });
    param.addCase(markAsRead.rejected, (s, a) => {
      s.error = (typeof a.payload === "string" ? a.payload : null) ??
        a.error.message ??
        "Failed to mark notification as read";
    });
    param.addCase(markAllAsRead.rejected, (s, a) => {
      s.error = (typeof a.payload === "string" ? a.payload : null) ??
        a.error.message ??
        "Failed to mark all notifications as read";
    });
    param.addCase(acknowledgeNotification.rejected, (s, a) => {
      s.error = (typeof a.payload === "string" ? a.payload : null) ??
        a.error.message ??
        "Failed to confirm notification";
    });
    param.addCase(dismissNotification.rejected, (s, a) => {
      s.error = (typeof a.payload === "string" ? a.payload : null) ??
        a.error.message ??
        "Failed to dismiss notification";
    });
  },
});

export const { setOpen, clearNotifications } = notificationsSlice.actions;
export default notificationsSlice.reducer;
