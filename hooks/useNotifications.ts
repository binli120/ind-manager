// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  setOpen,
} from "@/lib/store/slices/notificationsSlice";

/*TODO: add real-time? */
export function useNotifications(userId?: string) {
  const dispatch = useAppDispatch();
  const { items, unread, loading, error, isOpen } = useAppSelector(
    (s) => s.notifications
  );

  // load once when we have the userId
  useEffect(() => {
    if (!userId) return;
    dispatch(fetchNotifications({ userId }));
  }, [dispatch, userId]);

  const open = () => dispatch(setOpen(true));
  const close = () => dispatch(setOpen(false));
  const toggle = () => dispatch(setOpen(!isOpen));

  const markOne = (id: string) => dispatch(markAsRead({ id }));
  const markAll = () => userId && dispatch(markAllAsRead({ userId }));

  return {
    items,
    unread,
    loading,
    error,
    isOpen,
    open,
    close,
    toggle,
    markOne,
    markAll,
  };
}
