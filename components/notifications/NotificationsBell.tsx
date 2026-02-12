// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";

type Props = { userId?: string };

export function NotificationsBell({ userId }: Props) {
  const { unread, toggle, isOpen } = useNotifications(userId);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={toggle}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-controls="notifications-panel"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" />
      </Button>

      {unread > 0 && (
        <span
          className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center
                     rounded-full bg-red-500 px-1 text-[10px] font-medium text-white"
        >
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </div>
  );
}
