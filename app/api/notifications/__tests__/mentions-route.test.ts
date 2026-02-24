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

jest.mock("@/lib/notifications/server", () => {
  const actual = jest.requireActual("@/lib/notifications/server");
  return {
    ...actual,
    dispatchNotification: (...args: unknown[]) => dispatchNotificationMock(...args),
  };
});

import { POST } from "@/app/api/notifications/mentions/route";

function makeRequest(payload: unknown) {
  return new NextRequest("http://localhost/api/notifications/mentions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

function makeSupabaseMock() {
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "u1", user_metadata: {} } },
        error: null,
      }),
    },
  };
}

describe("POST /api/notifications/mentions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    checkRateLimitMock.mockReturnValue(null);
    dispatchNotificationMock.mockResolvedValue({
      eventId: "evt-mention",
      recipientCount: 1,
      email: { sent: 0, failed: 0, skipped: 1 },
      unresolvedHandles: [],
    });
  });

  it("returns early when no mentions are present", async () => {
    createClientMock.mockResolvedValue(makeSupabaseMock());

    const response = await POST(makeRequest({ content: "No mentions here" }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.recipients).toBe(0);
    expect(dispatchNotificationMock).not.toHaveBeenCalled();
  });

  it("dispatches mention notifications when handles are present", async () => {
    createClientMock.mockResolvedValue(makeSupabaseMock());

    const response = await POST(
      makeRequest({
        content: "Please review @janedoe",
        commentId: "e0f76813-8fd5-43ba-bd7b-0e78d2056d6d",
        channels: { inApp: true, email: false },
      }),
    );

    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.recipients).toBe(1);
    expect(dispatchNotificationMock).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({
        scope: "user",
        sourceType: "mention",
        targetHandles: ["janedoe"],
      }),
    );
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

    const response = await POST(makeRequest({ content: "@janedoe" }));
    expect(response.status).toBe(401);
  });
});
