import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit/rate-limit-helpers";
import {
  NotificationRecipientAction,
  notificationRecipientActionSchema,
} from "@/lib/notifications/types";

const patchSchema = z.object({
  action: notificationRecipientActionSchema,
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ recipientId: string }> },
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimited = checkRateLimit({ tier: "write", request, userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { recipientId } = await context.params;
  const now = new Date().toISOString();

  let updates: Record<string, unknown> = {};
  switch (parsed.data.action) {
    case NotificationRecipientAction.Read:
      updates = { is_read: true, read_at: now };
      break;
    case NotificationRecipientAction.Dismiss:
      updates = { is_dismissed: true, dismissed_at: now };
      break;
    case NotificationRecipientAction.Acknowledge:
      updates = { is_read: true, read_at: now };
      break;
    case NotificationRecipientAction.Restore:
      updates = { is_dismissed: false, dismissed_at: null };
      break;
    default:
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("notification_recipients")
    .update(updates)
    .eq("id", recipientId)
    .eq("user_id", user.id)
    .select("id,is_read,is_dismissed,read_at,dismissed_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!data) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }

  return NextResponse.json({ notification: data });
}
