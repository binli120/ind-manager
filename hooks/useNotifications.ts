// Author: Bin Lee
// Email: binlee120@gmail.com

"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  acknowledgeNotification,
  dismissNotification,
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

    const interval = window.setInterval(() => {
      dispatch(fetchNotifications({ userId }));
    }, 30_000);

    return () => window.clearInterval(interval);
  }, [dispatch, userId]);

  const open = () => dispatch(setOpen(true));
  const close = () => dispatch(setOpen(false));
  const toggle = () => dispatch(setOpen(!isOpen));

  const markOne = (id: string) => dispatch(markAsRead({ id }));
  const confirmOne = (id: string) => dispatch(acknowledgeNotification({ id }));
  const dismissOne = (id: string) => dispatch(dismissNotification({ id }));
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
    confirmOne,
    dismissOne,
    markAll,
  };
}
