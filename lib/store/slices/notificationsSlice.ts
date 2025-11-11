import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { createClient } from "@/lib/supabase/client";

export type NotificationType = 'project_status' | 'document_change';


export type NotificationRow = {
  id: string;
  user_id: string;
  type: NotificationType;
  from: string | null;
  resource_id: string | null;
  is_read: boolean;
  created_at: string;
};

interface NotificationsState {
  items: NotificationRow[];
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
  { items: NotificationRow[]; unread: number },
  { userId: string }
>("notifications/fetchAll", async ({ userId }, { rejectWithValue }) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return rejectWithValue(error.message);

  const unread = (data ?? []).filter((n) => !n.is_read).length;
  return { items: (data ?? []) as NotificationRow[], unread };
});

export const markAsRead = createAsyncThunk<
  { id: string },
  { id: string }
>("notifications/markAsRead", async ({ id }, { rejectWithValue }) => {
  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id);

  if (error) return rejectWithValue(error.message);
  return { id };
});

export const markAllAsRead = createAsyncThunk<
  void,
  { userId: string }
>("notifications/markAllAsRead", async ({ userId }, { rejectWithValue }) => {
  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

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
      s.error = String(a.payload ?? a.error.message);
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
  },
});

export const { setOpen, clearNotifications } = notificationsSlice.actions;
export default notificationsSlice.reducer;