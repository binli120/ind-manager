"use client";

import * as React from "react";
import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  NotificationScope,
  NotificationSourceType,
  NotificationType,
} from "@/lib/notifications/types";
import { useAppDispatch } from "@/lib/store";
import { sendNotification } from "@/lib/store/slices/notificationsSlice";
import { isAdminEmail } from "@/lib/utils";

type CurrentUser = {
  id: string;
  email: string;
  role?: string | null;
  privilege?: string | null;
};

type ProjectOption = {
  id: string;
  title: string;
  code?: string | null;
};

const adminPrivileges = new Set([
  "system_admin",
  "user_manager",
  "admin",
  "system_administrator",
]);

const canSendGlobal = (user: CurrentUser | null | undefined) => {
  if (!user) return false;
  if (isAdminEmail(user.email)) return true;
  if (user.privilege && adminPrivileges.has(user.privilege)) return true;
  if (user.role && adminPrivileges.has(user.role)) return true;
  return false;
};

type Props = {
  currentUser?: CurrentUser | null;
  projects: ProjectOption[];
};

export function SendNotificationDialog({ currentUser, projects }: Props) {
  const dispatch = useAppDispatch();
  const isAdmin = canSendGlobal(currentUser);
  const [open, setOpen] = React.useState(false);
  const [scope, setScope] = React.useState<NotificationScope>(
    NotificationScope.System,
  );
  const [projectId, setProjectId] = React.useState<string>(projects[0]?.id ?? "");
  const [target, setTarget] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [actionUrl, setActionUrl] = React.useState("");
  const [sendInApp, setSendInApp] = React.useState(true);
  const [sendEmail, setSendEmail] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [resultMessage, setResultMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isAdmin) {
      setScope(NotificationScope.Project);
    }
  }, [isAdmin]);

  React.useEffect(() => {
    if (!projectId && projects.length > 0) {
      setProjectId(projects[0].id);
    }
  }, [projectId, projects]);

  if (!currentUser || !isAdmin) {
    return null;
  }

  const handleSubmit = async () => {
    setError(null);
    setResultMessage(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    if (!sendInApp && !sendEmail) {
      setError("Select at least one delivery channel.");
      return;
    }

    if (scope === NotificationScope.Project && !projectId) {
      setError("Select a project.");
      return;
    }

    if (scope === NotificationScope.User && !target.trim()) {
      setError("Provide a user target such as @janedoe or a user ID.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = await dispatch(
        sendNotification({
          refreshUserId: currentUser.id,
          request: {
            scope,
            sourceType: NotificationSourceType.Manual,
            type:
              scope === NotificationScope.User
                ? NotificationType.DocumentComment
                : NotificationType.SystemAlert,
            title: title.trim(),
            body: body.trim() || undefined,
            actionUrl: actionUrl.trim() || undefined,
            projectId:
              scope === NotificationScope.Project ? projectId : undefined,
            target: scope === NotificationScope.User ? target.trim() : undefined,
            channels: {
              inApp: sendInApp,
              email: sendEmail,
            },
            skipActor: true,
          },
        }),
      ).unwrap();

      const unresolved =
        Array.isArray(payload.unresolvedHandles) && payload.unresolvedHandles.length > 0
          ? ` Unresolved: ${payload.unresolvedHandles.join(", ")}.`
          : "";
      setResultMessage(
        `Sent to ${payload.recipients ?? 0} recipient(s).${unresolved}`,
      );

      setTitle("");
      setBody("");
      setActionUrl("");
      setTarget("");
    } catch (submitError: unknown) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : typeof submitError === "string"
            ? submitError
          : "Failed to send notification";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) {
          setError(null);
          setResultMessage(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Send notification">
          <Megaphone className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Notification</DialogTitle>
          <DialogDescription>
            Send a system-wide alert, project group update, or direct user notification.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="notify-scope">Scope</Label>
            <Select
              value={scope}
              onValueChange={(value) => setScope(value as NotificationScope)}
            >
              <SelectTrigger id="notify-scope" className="w-full">
                <SelectValue placeholder="Select scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NotificationScope.System}>
                  System-wide (all users)
                </SelectItem>
                <SelectItem value={NotificationScope.Project}>
                  Project user group
                </SelectItem>
                <SelectItem value={NotificationScope.User}>
                  Single user
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {scope === NotificationScope.Project && (
            <div className="grid gap-2">
              <Label htmlFor="notify-project">Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger id="notify-project" className="w-full">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                      {project.code ? ` (${project.code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {scope === NotificationScope.User && (
            <div className="grid gap-2">
              <Label htmlFor="notify-target">Target user</Label>
              <Input
                id="notify-target"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="@janedoe, @johnsmith"
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="notify-title">Title</Label>
            <Input
              id="notify-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notify-body">Message</Label>
            <Textarea
              id="notify-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write the notification body"
              className="min-h-24"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notify-url">Link (optional)</Label>
            <Input
              id="notify-url"
              value={actionUrl}
              onChange={(e) => setActionUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="notify-inapp"
                checked={sendInApp}
                onCheckedChange={(checked) => setSendInApp(checked === true)}
              />
              <Label htmlFor="notify-inapp">In-app</Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="notify-email"
                checked={sendEmail}
                onCheckedChange={(checked) => setSendEmail(checked === true)}
              />
              <Label htmlFor="notify-email">Email</Label>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {resultMessage && <p className="text-sm text-emerald-600">{resultMessage}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
