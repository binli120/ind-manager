"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { Check, FileText, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { userId?: string; className?: string };

function timeAgo(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.max(1, Math.round(diff / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

function iconFor(type?: string) {
  switch (type) {
    case "project_status":
      return <TriangleAlert className="w-4 h-4 text-amber-500 shrink-0" />;
    case "document_change":
      return <FileText className="w-4 h-4 text-blue-500 shrink-0" />;
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
    toggle,
    markOne,
    markAll,
  } = useNotifications(userId);

  // Close on Escape
  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && toggle();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, toggle]);

  // Click-away close
  const ref = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (!isOpen) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) toggle();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [isOpen, toggle]);

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
          <span className="text-xs text-muted-foreground">({unread} unread)</span>
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
            You're all caught up!
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
                {iconFor(n.type)}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {n.type === "project_status"
                        ? "Project status changed"
                        : n.type === "document_change"
                        ? "Document updated"
                        : "Notification"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(n.created_at)}
                    </span>
                  </div>

                  <div className="mt-1 text-sm text-muted-foreground">
                    {n.from ? <span>by <strong>{n.from}</strong></span> : null}
                    {n.resource_id ? (
                      <span className="ml-1 text-xs">({n.resource_id})</span>
                    ) : null}
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    {!n.is_read && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => markOne(n.id)}
                      >
                        Mark read
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
        <Button variant="ghost" size="sm" onClick={toggle}>
          Close
        </Button>
      </div>
    </div>
  );
}
