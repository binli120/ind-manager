import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit/rate-limit-helpers";
import { dispatchNotification, extractMentionHandles } from "@/lib/notifications/server";
import { mentionNotificationRequestSchema } from "@/lib/notifications/types";

export async function POST(request: NextRequest) {
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
  const parsed = mentionNotificationRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid payload",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const handles = extractMentionHandles(input.content);

  if (handles.length === 0) {
    return NextResponse.json({
      eventId: null,
      recipients: 0,
      email: { sent: 0, failed: 0, skipped: 0 },
      unresolvedHandles: [],
      matchedHandles: [],
    });
  }

  try {
    const result = await dispatchNotification(user.id, {
      scope: "user",
      sourceType: "mention",
      type: "document_comment",
      title: input.title ?? "You were mentioned in a comment",
      body: input.content.slice(0, 600),
      actionUrl: input.actionUrl,
      projectId: input.projectId,
      targetHandles: handles,
      resourceType: "document_comment",
      resourceId: input.commentId ?? input.resourceId,
      context: {
        comment_id: input.commentId,
        thread_id: input.threadId,
        anchor_id: input.anchorId,
        document_version_id: input.documentVersionId,
      },
      channels: input.channels,
      skipActor: true,
    });

    return NextResponse.json({
      eventId: result.eventId,
      recipients: result.recipientCount,
      email: result.email,
      unresolvedHandles: result.unresolvedHandles,
      matchedHandles: handles,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send mention notifications";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
