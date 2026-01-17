import type { Database } from "@/lib/supabase/schema";
import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { createClient } from "@/lib/supabase/client";

type NotificationEvent =
  Database["public"]["Tables"]["notification_events"]["Row"];
type NotificationRecipient =
  Database["public"]["Tables"]["notification_recipients"]["Row"];


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
  { rejectValue: string}
>("notifications/fetchAll", async ({ userId }, { rejectWithValue }) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notification_recipients")
    .select(`
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
    `)
    .eq("user_id", userId)
    .eq("is_dismissed", false)
    .order("created_at", { ascending: false })

  if (error) return rejectWithValue(error.message);

  const items = (data ?? []).map((row) => ({
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
  }));

  const unread = items.filter((n) => !n.is_read).length;
  return { items, unread };
});


export const markAsRead = createAsyncThunk<
  { id: string },
  { id: string },
  { rejectValue: string}
>("notifications/markAsRead", async ({ id }, { rejectWithValue }) => {
  const supabase = createClient();
  const { error } = await supabase
    .from("notification_recipients")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return rejectWithValue(error.message);
  return { id };
});



export const markAllAsRead = createAsyncThunk<
  void,
  { userId: string },
  { rejectValue: string}
>("notifications/markAllAsRead", async ({ userId }, { rejectWithValue }) => {
  const supabase = createClient();
  const { error } = await supabase
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
  extraReducers: (b) => {
    b.addCase(fetchNotifications.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    b.addCase(fetchNotifications.fulfilled, (s, a) => {
      s.loading = false;
      s.items = a.payload.items;
      s.unread = a.payload.unread;
    });
    b.addCase(fetchNotifications.rejected, (s, a) => {
      s.loading = false;
      s.error = 
        (typeof a.payload === "string" ? a.payload : null) ??
        a.error.message ??
        "Failed to load notifications";
    });

    b.addCase(markAsRead.fulfilled, (s, a) => {
      const idx = s.items.findIndex((x) => x.id === a.payload.id);
        if (idx >= 0 && !s.items[idx].is_read) {
          s.items[idx].is_read = true;
          s.unread = Math.max(0, s.unread - 1);
        }
    });

    b.addCase(markAllAsRead.fulfilled, (s, a) => {
      s.items = s.items.map((n) => ({ ...n, is_read: true }));
      s.unread = 0;
    });
    b.addCase(markAsRead.rejected, (s, a) => {
      s.error = (typeof a.payload === "string" ? a.payload : null) ??
      a.error.message ?? 
      "Failed to mark notification as read";
    });
    b.addCase(markAllAsRead.rejected, (s, a) => {
      s.error = (typeof a.payload === "string" ? a.payload : null) ??
      a.error.message ?? 
      "Failed to mark all notifications as read";
    });
  },
});

export const { setOpen, clearNotifications } = notificationsSlice.actions;
export default notificationsSlice.reducer;