/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

const createClientMock = jest.fn();
const checkRateLimitMock = jest.fn();
const dispatchNotificationMock = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock(),
}));

jest.mock("@/lib/rate-limit/rate-limit-helpers", () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimitMock(...args),
}));

jest.mock("@/lib/notifications/server", () => ({
  dispatchNotification: (...args: unknown[]) => dispatchNotificationMock(...args),
}));

import { POST } from "@/app/api/notifications/route";

function makeRequest(payload: unknown) {
  return new NextRequest("http://localhost/api/notifications", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

function makeSupabaseMock(args?: {
  user?: { id: string; user_metadata?: Record<string, unknown> } | null;
  submissionRole?: string | null;
  isProjectMember?: boolean;
}) {
  const user = args?.user ?? { id: "u1", user_metadata: {} };
  const submissionRole = args?.submissionRole ?? null;
  const isProjectMember = args?.isProjectMember ?? false;

  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user },
        error: null,
      }),
    },
    from: jest.fn((table: string) => {
      if (table === "users") {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle: jest.fn().mockResolvedValue({
                data: submissionRole ? { submission_role: submissionRole } : null,
              }),
            })),
          })),
        };
      }

      if (table === "user_project") {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: isProjectMember ? { id: "up1" } : null,
                }),
              })),
            })),
          })),
        };
      }

      return {
        select: jest.fn(() => ({
          maybeSingle: jest.fn().mockResolvedValue({ data: null }),
        })),
      };
    }),
  };
}

describe("POST /api/notifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    checkRateLimitMock.mockReturnValue(null);
    dispatchNotificationMock.mockResolvedValue({
      eventId: "evt-1",
      recipientCount: 2,
      email: { sent: 0, failed: 0, skipped: 2 },
      unresolvedHandles: [],
    });
  });

  it("returns 401 when unauthenticated", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    });

    const response = await POST(makeRequest({}));
    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid payload", async () => {
    createClientMock.mockResolvedValue(makeSupabaseMock());

    const response = await POST(makeRequest({ scope: "system" }));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Invalid payload");
  });

  it("returns 403 for non-admin system notifications", async () => {
    createClientMock.mockResolvedValue(
      makeSupabaseMock({
        user: { id: "u1", user_metadata: { privilege: "user", role: "guest" } },
        submissionRole: "project_manager",
      }),
    );

    const response = await POST(
      makeRequest({
        scope: "system",
        title: "Maintenance",
        type: "system_alert",
        channels: { inApp: true, email: false },
      }),
    );

    const json = await response.json();
    expect(response.status).toBe(403);
    expect(json.error).toMatch(/Only admins/i);
    expect(dispatchNotificationMock).not.toHaveBeenCalled();
  });

  it("dispatches a user-targeted notification", async () => {
    createClientMock.mockResolvedValue(
      makeSupabaseMock({
        user: { id: "u-admin", user_metadata: { privilege: "admin" } },
      }),
    );

    const response = await POST(
      makeRequest({
        scope: "user",
        title: "Need your review",
        type: "document_comment",
        target: "@janedoe",
        channels: { inApp: true, email: false },
      }),
    );

    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.recipients).toBe(2);
    expect(dispatchNotificationMock).toHaveBeenCalledWith(
      "u-admin",
      expect.objectContaining({
        scope: "user",
        title: "Need your review",
      }),
    );
  });
});
