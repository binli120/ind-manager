// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { Check, FileText, Info, TriangleAlert } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";

type Props = { userId?: string; className?: string };


function iconFor(type?: string | null, severity?: string | null) {
  if (severity === "critical") {
    return <TriangleAlert className="w-4 h-4 text-red-500 shrink-0" />;
  }
  switch (type) {
    case "document_comment":
      return <FileText className="w-4 h-4 text-blue-500 shrink-0" />;
    case "task_assignment":
      return <Check className="w-4 h-4 text-emerald-500 shrink-0" />;
    case "deadline_reminder":
      return <TriangleAlert className="w-4 h-4 text-amber-500 shrink-0" />;
    case "system_alert":
      return <TriangleAlert className="w-4 h-4 text-rose-500 shrink-0" />;
    default:
      return <Info className="w-4 h-4 text-muted-foreground shrink-0" />;
  }
}



export function NotificationsPanel({ userId, className }: Props) {
  const {
    items,
    unread,
    loading,
    error,
    isOpen,
    close,
    markOne,
    markAll,
  } = useNotifications(userId);
  //Guard unread
  const unreadCount = typeof unread === "number" ? unread : 0;

  // combine click-away&close escape
  const ref = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();

    const dismiss = () => close();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };

    const onDown = (e: PointerEvent) => {
      const el = ref.current;
      if (el && !el.contains(e.target as Node)) dismiss();
    };

    window.addEventListener("keydown", onKey, { signal: controller.signal });
    document.addEventListener("pointerdown", onDown, { signal: controller.signal });
    return () => {
      controller.abort()
    };
  }, [isOpen, close]);

  if (!isOpen) return null;


  return (
    <div
      id="notifications-panel"
      role="dialog"
      aria-modal="false"
      ref={ref}
      className={cn(
        "fixed right-4 top-14 z-50 w-[380px] max-w-[92vw] rounded-lg border bg-popover text-popover-foreground shadow-lg",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Notifications</span>
          <span className="text-xs text-muted-foreground">({unreadCount} unread)</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => markAll()}
          disabled={unread === 0 || loading}
        >
          <Check className="w-4 h-4 mr-1" />
          Mark all read
        </Button>
      </div>

      {/* Body */}
      <div className="max-h-[60vh] overflow-auto">
        {loading && (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            Loading…
          </div>
        )}

        {!!error && !loading && (
          <div className="px-4 py-3 text-sm text-destructive">{error}</div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="px-4 py-10 text-sm text-muted-foreground text-center">
            You&apos;re all caught up!
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <ul className="divide-y">
            {items.map((n) => (
              <li
                key={n.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3",
                  !n.is_read ? "bg-accent/40" : ""
                )}
              >
                {iconFor(n.type, n.severity)}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {n.title ??
                        (n.type === "document_comment"
                          ? "New comment"
                          : n.type === "task_assignment"
                          ? "Task assigned"
                          : n.type === "deadline_reminder"
                          ? "Deadline reminder"
                          : n.type === "system_alert"
                          ? "System alert"
                          : "Notification")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(n.created_at)}
                    </span>
                  </div>

                  {n.body ? (
                    <div className="mt-1 text-sm text-muted-foreground">{n.body}</div>
                  ) : (
                    <div className="mt-1 text-sm text-muted-foreground">
                      {n.from ? (
                        <span>
                          by <strong>{n.from}</strong>
                        </span>
                      ) : null}
                      {n.resource_id ? (
                        <span className="ml-1 text-xs">({n.resource_id})</span>
                      ) : null}
                    </div>
                  )}

                  <div className="mt-2 flex items-center gap-2">
                    {!n.is_read && (
                      <Button size="sm" variant="secondary" onClick={() => markOne(n.id)}>
                        Mark read
                      </Button>
                    )}
                    {n.action_url && (
                      <Button asChild size="sm" variant="outline">
                        <a href={n.action_url}>Open</a>
                      </Button>
                    )}
                  </div>
                </div>

              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 px-4 py-3 border-t">
        <Button variant="ghost" size="sm" onClick={close}>
          Close
        </Button>
      </div>
    </div>
  );
}
