import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/schema";
import type { DispatchNotificationRequest } from "@/lib/notifications/types";

const SERVICE_ROLE_ENV_KEYS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SERVICE_KEY",
] as const;

const ACTIVE_USER_STATUSES = ["active", "invited", "pending"] as const;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type DispatchNotificationResult = {
  eventId: string | null;
  recipientCount: number;
  email: {
    sent: number;
    failed: number;
    skipped: number;
  };
  unresolvedHandles: string[];
};

type Recipient = {
  id: string;
  email: string | null;
  name: string | null;
};

export function extractMentionHandles(content: string): string[] {
  const mentions = new Set<string>();
  const mentionRegex = /(^|\s)@([a-z0-9][a-z0-9._-]{1,63})/gi;
  let match: RegExpExecArray | null = mentionRegex.exec(content);

  while (match) {
    const raw = match[2]?.trim();
    const normalized = normalizeHandle(raw);
    if (normalized) mentions.add(normalized);
    match = mentionRegex.exec(content);
  }

  return [...mentions];
}

export function parseTargetTokens(target?: string): {
  userIds: string[];
  handles: string[];
} {
  if (!target) return { userIds: [], handles: [] };

  const userIds = new Set<string>();
  const handles = new Set<string>();

  for (const token of target.split(/[\s,;]+/)) {
    const normalized = token.trim();
    if (!normalized) continue;

    if (UUID_REGEX.test(normalized)) {
      userIds.add(normalized);
      continue;
    }

    const handle = normalizeHandle(normalized);
    if (handle) handles.add(handle);
  }

  return {
    userIds: [...userIds],
    handles: [...handles],
  };
}

function normalizeHandle(value?: string | null): string {
  if (!value) return "";
  return value
    .trim()
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9._-]+/g, "")
    .replace(/^[._-]+|[._-]+$/g, "");
}

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? "";

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      `Supabase admin configuration is missing. Set one of: ${SERVICE_ROLE_ENV_KEYS.join(", ")}`,
    );
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function dedupeRecipients(recipients: Recipient[]): Recipient[] {
  const seen = new Set<string>();
  const unique: Recipient[] = [];
  for (const recipient of recipients) {
    if (!recipient.id || seen.has(recipient.id)) continue;
    seen.add(recipient.id);
    unique.push(recipient);
  }
  return unique;
}

async function fetchRecipientsByUserIds(
  adminClient: ReturnType<typeof createAdminClient>,
  userIds: string[],
): Promise<Recipient[]> {
  if (userIds.length === 0) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (adminClient as any)
    .from("users")
    .select("id,name,email,status")
    .in("id", userIds)
    .in("status", [...ACTIVE_USER_STATUSES]);

  if (error) throw new Error(error.message || "Failed to load target users");

  return (Array.isArray(data) ? data : []).map((row) => ({
    id: String(row.id),
    name: typeof row.name === "string" ? row.name : null,
    email: typeof row.email === "string" ? row.email : null,
  }));
}

async function fetchRecipientsByProject(
  adminClient: ReturnType<typeof createAdminClient>,
  projectId: string,
): Promise<Recipient[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (adminClient as any)
    .from("user_project")
    .select("user_id, users:user_id ( id, name, email, status )")
    .eq("project_id", projectId);

  if (error) throw new Error(error.message || "Failed to load project users");

  const recipients: Recipient[] = [];
  for (const row of Array.isArray(data) ? data : []) {
    const usersNode = row.users;
    const user = Array.isArray(usersNode) ? usersNode[0] : usersNode;
    if (!user?.id) continue;

    const status = typeof user.status === "string" ? user.status : null;
    if (!status || !ACTIVE_USER_STATUSES.includes(status as (typeof ACTIVE_USER_STATUSES)[number])) {
      continue;
    }

    recipients.push({
      id: String(user.id),
      name: typeof user.name === "string" ? user.name : null,
      email: typeof user.email === "string" ? user.email : null,
    });
  }

  return dedupeRecipients(recipients);
}

async function fetchAllActiveUsers(
  adminClient: ReturnType<typeof createAdminClient>,
): Promise<Recipient[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (adminClient as any)
    .from("users")
    .select("id,name,email,status")
    .in("status", [...ACTIVE_USER_STATUSES]);

  if (error) throw new Error(error.message || "Failed to load users");

  return (Array.isArray(data) ? data : []).map((row) => ({
    id: String(row.id),
    name: typeof row.name === "string" ? row.name : null,
    email: typeof row.email === "string" ? row.email : null,
  }));
}

async function resolveHandles(
  adminClient: ReturnType<typeof createAdminClient>,
  handles: string[],
): Promise<{ recipients: Recipient[]; unresolvedHandles: string[] }> {
  if (handles.length === 0) {
    return { recipients: [], unresolvedHandles: [] };
  }

  const allUsers = await fetchAllActiveUsers(adminClient);

  const handleToRecipient = new Map<string, Recipient>();

  for (const user of allUsers) {
    const candidateHandles = new Set<string>();

    if (user.email) {
      const localPart = user.email.split("@")[0] ?? "";
      const normalizedLocalPart = normalizeHandle(localPart);
      if (normalizedLocalPart) candidateHandles.add(normalizedLocalPart);
    }

    if (user.name) {
      const normalizedName = normalizeHandle(user.name);
      if (normalizedName) candidateHandles.add(normalizedName);
      const compactName = normalizeHandle(user.name.replace(/\s+/g, ""));
      if (compactName) candidateHandles.add(compactName);
    }

    for (const candidate of candidateHandles) {
      if (!handleToRecipient.has(candidate)) {
        handleToRecipient.set(candidate, user);
      }
    }
  }

  const recipients: Recipient[] = [];
  const unresolvedHandles: string[] = [];

  for (const handle of handles) {
    const normalized = normalizeHandle(handle);
    if (!normalized) continue;

    const recipient = handleToRecipient.get(normalized);
    if (recipient) {
      recipients.push(recipient);
    } else {
      unresolvedHandles.push(normalized);
    }
  }

  return {
    recipients: dedupeRecipients(recipients),
    unresolvedHandles,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function sendEmailNotification(args: {
  to: string;
  title: string;
  body?: string;
  actionUrl?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.NOTIFICATION_EMAIL_FROM?.trim();

  if (!resendApiKey || !from) {
    return { ok: false, error: "Email delivery is not configured" };
  }

  const safeTitle = escapeHtml(args.title);
  const safeBody = escapeHtml(args.body ?? "");
  const safeAction = args.actionUrl ? escapeHtml(args.actionUrl) : null;

  const html = [
    `<h2>${safeTitle}</h2>`,
    safeBody ? `<p>${safeBody}</p>` : "",
    safeAction ? `<p><a href=\"${safeAction}\">Open in IND Manager</a></p>` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [args.to],
      subject: args.title,
      html,
    }),
  });

  if (response.ok) {
    return { ok: true };
  }

  const payload = await response.text();
  return {
    ok: false,
    error: payload || `Email provider failed with status ${response.status}`,
  };
}

export async function dispatchNotification(
  actorUserId: string,
  request: DispatchNotificationRequest,
): Promise<DispatchNotificationResult> {
  const adminClient = createAdminClient();

  const parsedTarget = parseTargetTokens(request.target);
  const targetIds = [
    ...(request.targetUserIds ?? []),
    ...parsedTarget.userIds,
  ];
  const targetHandles = [
    ...(request.targetHandles ?? []),
    ...parsedTarget.handles,
  ].map((value) => normalizeHandle(value));

  let recipients: Recipient[] = [];
  let unresolvedHandles: string[] = [];

  if (request.scope === "system") {
    recipients = await fetchAllActiveUsers(adminClient);
  }

  if (request.scope === "project") {
    recipients = await fetchRecipientsByProject(adminClient, request.projectId!);
  }

  if (request.scope === "user") {
    const byIds = await fetchRecipientsByUserIds(adminClient, targetIds);
    const byHandles = await resolveHandles(adminClient, targetHandles);
    recipients = dedupeRecipients([...byIds, ...byHandles.recipients]);
    unresolvedHandles = byHandles.unresolvedHandles;
  }

  if (request.skipActor) {
    recipients = recipients.filter((recipient) => recipient.id !== actorUserId);
  }

  recipients = dedupeRecipients(recipients);

  if (recipients.length === 0) {
    return {
      eventId: null,
      recipientCount: 0,
      email: {
        sent: 0,
        failed: 0,
        skipped: 0,
      },
      unresolvedHandles,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: insertedEvent, error: eventError } = await (adminClient as any)
    .from("notification_events")
    .insert({
      type: request.type,
      title: request.title,
      body: request.body ?? null,
      resource_type: request.resourceType ?? null,
      resource_id: request.resourceId ?? null,
      action_url: request.actionUrl ?? null,
      severity: request.severity ?? null,
      created_by: actorUserId,
      audience_scope: request.scope,
      project_id: request.projectId ?? null,
      target_user_id:
        request.scope === "user" && recipients.length === 1
          ? recipients[0].id
          : null,
      source_type: request.sourceType,
      context_payload: request.context ?? {},
    })
    .select("id")
    .single();

  if (eventError || !insertedEvent?.id) {
    throw new Error(eventError?.message || "Failed to create notification event");
  }

  const deliveryChannel =
    request.channels.email && request.channels.inApp
      ? "in_app_email"
      : request.channels.email
        ? "email"
        : "in_app";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: insertedRecipients, error: recipientsError } = await (adminClient as any)
    .from("notification_recipients")
    .insert(
      recipients.map((recipient) => ({
        notification_id: insertedEvent.id,
        user_id: recipient.id,
        is_read: !request.channels.inApp,
        is_dismissed: !request.channels.inApp,
        delivery_channel: deliveryChannel,
        email_status: request.channels.email ? "pending" : "skipped",
      })),
    )
    .select("id,user_id");

  if (recipientsError) {
    throw new Error(recipientsError.message || "Failed to create notification recipients");
  }

  const recipientRows = Array.isArray(insertedRecipients) ? insertedRecipients : [];

  const emailResult = {
    sent: 0,
    failed: 0,
    skipped: 0,
  };

  if (!request.channels.email) {
    emailResult.skipped = recipientRows.length;
    return {
      eventId: insertedEvent.id,
      recipientCount: recipientRows.length,
      email: emailResult,
      unresolvedHandles,
    };
  }

  const resendConfigured =
    Boolean(process.env.RESEND_API_KEY?.trim()) &&
    Boolean(process.env.NOTIFICATION_EMAIL_FROM?.trim());

  for (const row of recipientRows) {
    const recipient = recipients.find((item) => item.id === row.user_id);
    const recipientId = String(row.id);

    if (!recipient?.email) {
      emailResult.skipped += 1;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (adminClient as any)
        .from("notification_recipients")
        .update({
          email_status: "skipped",
          email_error: "Target user has no email",
        })
        .eq("id", recipientId);
      continue;
    }

    if (!resendConfigured) {
      emailResult.skipped += 1;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (adminClient as any)
        .from("notification_recipients")
        .update({
          email_status: "skipped",
          email_error:
            "Email delivery is not configured. Set RESEND_API_KEY and NOTIFICATION_EMAIL_FROM",
        })
        .eq("id", recipientId);
      continue;
    }

    const sendResult = await sendEmailNotification({
      to: recipient.email,
      title: request.title,
      body: request.body,
      actionUrl: request.actionUrl,
    });

    if (sendResult.ok) {
      emailResult.sent += 1;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (adminClient as any)
        .from("notification_recipients")
        .update({
          email_status: "sent",
          email_sent_at: new Date().toISOString(),
          email_error: null,
        })
        .eq("id", recipientId);
    } else {
      emailResult.failed += 1;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (adminClient as any)
        .from("notification_recipients")
        .update({
          email_status: "failed",
          email_error: sendResult.error ?? "Unknown email delivery failure",
        })
        .eq("id", recipientId);
    }
  }

  return {
    eventId: insertedEvent.id,
    recipientCount: recipientRows.length,
    email: emailResult,
    unresolvedHandles,
  };
}
