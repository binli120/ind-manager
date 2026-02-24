import { type NextRequest, NextResponse } from "next/server";
import { isAdminUser } from "@/lib/auth/is-admin-user";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit/rate-limit-helpers";
import {
  dispatchNotification,
  type DispatchNotificationResult,
} from "@/lib/notifications/server";
import { dispatchNotificationRequestSchema } from "@/lib/notifications/types";

async function isProjectMember(args: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  projectId: string;
}) {
  const { supabase, userId, projectId } = args;
  const { data } = await supabase
    .from("user_project")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data?.id);
}

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
  const parsed = dispatchNotificationRequestSchema.safeParse(body);

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
  const privilege = String(user.user_metadata?.privilege ?? "");
  const role = String(user.user_metadata?.role ?? "");
  const isAdmin = await isAdminUser({
    supabase,
    userId: user.id,
    privilege,
    role,
  });

  if (input.scope === "system") {
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only admins can send system-wide notifications" },
        { status: 403 },
      );
    }
  }

  if (input.scope === "project" && !isAdmin) {
    const member = await isProjectMember({
      supabase,
      userId: user.id,
      projectId: input.projectId!,
    });
    if (!member) {
      return NextResponse.json(
        { error: "Only project members can send project notifications" },
        { status: 403 },
      );
    }
  }

  let result: DispatchNotificationResult;
  try {
    result = await dispatchNotification(user.id, input);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send notification";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json(
    {
      eventId: result.eventId,
      recipients: result.recipientCount,
      email: result.email,
      unresolvedHandles: result.unresolvedHandles,
    },
    { status: 201 },
  );
}
