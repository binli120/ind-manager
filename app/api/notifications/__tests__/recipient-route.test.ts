/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { NotificationRecipientAction } from "@/lib/notifications/types";

const createClientMock = jest.fn();
const checkRateLimitMock = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock(),
}));

jest.mock("@/lib/rate-limit/rate-limit-helpers", () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimitMock(...args),
}));

import { PATCH } from "@/app/api/notifications/[recipientId]/route";

function makeRequest(payload: unknown) {
  return new NextRequest("http://localhost/api/notifications/r1", {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

type SupabasePatchMock = {
  updateMock: jest.Mock;
  maybeSingleMock: jest.Mock;
  supabase: {
    auth: {
      getUser: jest.Mock;
    };
    from: jest.Mock;
  };
};

function makeSupabasePatchMock(result?: { data: unknown; error: unknown }): SupabasePatchMock {
  const maybeSingleMock = jest
    .fn()
    .mockResolvedValue(result ?? { data: { id: "r1", is_read: true }, error: null });
  const selectMock = jest.fn(() => ({ maybeSingle: maybeSingleMock }));
  const eqUserMock = jest.fn(() => ({ select: selectMock }));
  const eqIdMock = jest.fn(() => ({ eq: eqUserMock }));
  const updateMock = jest.fn(() => ({ eq: eqIdMock }));

  return {
    updateMock,
    maybeSingleMock,
    supabase: {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "u1" } },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        update: updateMock,
      })),
    },
  };
}

describe("PATCH /api/notifications/[recipientId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    checkRateLimitMock.mockReturnValue(null);
  });

  it("returns 401 when unauthenticated", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    });

    const response = await PATCH(
      makeRequest({ action: NotificationRecipientAction.Read }),
      {
        params: Promise.resolve({ recipientId: "r1" }),
      },
    );

    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid action payload", async () => {
    const mock = makeSupabasePatchMock();
    createClientMock.mockResolvedValue(mock.supabase);

    const response = await PATCH(makeRequest({ action: "unknown" }), {
      params: Promise.resolve({ recipientId: "r1" }),
    });

    expect(response.status).toBe(400);
    expect(mock.updateMock).not.toHaveBeenCalled();
  });

  it("updates read state", async () => {
    const mock = makeSupabasePatchMock();
    createClientMock.mockResolvedValue(mock.supabase);

    const response = await PATCH(
      makeRequest({ action: NotificationRecipientAction.Read }),
      {
        params: Promise.resolve({ recipientId: "r1" }),
      },
    );

    const json = await response.json();

    expect(response.status).toBe(200);
    expect(mock.updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ is_read: true }),
    );
    expect(json.notification.id).toBe("r1");
  });

  it("returns 404 when recipient is not found", async () => {
    const mock = makeSupabasePatchMock({ data: null, error: null });
    createClientMock.mockResolvedValue(mock.supabase);

    const response = await PATCH(
      makeRequest({ action: NotificationRecipientAction.Dismiss }),
      {
        params: Promise.resolve({ recipientId: "missing" }),
      },
    );

    expect(response.status).toBe(404);
  });
});
