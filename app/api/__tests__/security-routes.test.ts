import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit/rate-limit-helpers";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => {
      const headerMap = new Map<string, string>();
      return {
        status: init?.status ?? 200,
        json: async () => body,
        headers: {
          set: (key: string, value: string) => {
            headerMap.set(key.toLowerCase(), value);
          },
          get: (key: string) => headerMap.get(key.toLowerCase()) ?? null,
        },
      };
    },
  },
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("@/lib/rate-limit/rate-limit-helpers", () => ({
  checkRateLimit: jest.fn(),
}));

jest.mock("@/lib/auth/auth-redirect", () => ({
  resolveAuthEmailRedirectUrl: jest.fn(() => "http://localhost:3000/auth/reset-password"),
}));

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(),
}));

import * as authRoute from "@/app/api/auth/route";
import * as usersRoute from "@/app/api/users/route";
import * as userByIdRoute from "@/app/api/users/[id]/route";
import * as adminProxyRoute from "@/app/api/admin/proxy/route";
import * as inviteRoute from "@/app/api/admin/users/invite/route";
import * as resendInviteRoute from "@/app/api/admin/users/resend-invite/route";
import * as healthRoute from "@/app/api/health/route";

const mockCreateClient = createClient as jest.Mock;
const mockCheckRateLimit = checkRateLimit as jest.Mock;

const makeRequest = ({
  url = "http://localhost:3000/api/test",
  body,
}: {
  url?: string;
  body?: unknown;
} = {}) =>
  ({
    url,
    nextUrl: new URL(url),
    json: async () => body,
  }) as unknown as NextRequest;

const authedUser = {
  id: "user-1",
  email: "user@example.com",
  user_metadata: {},
};

const unauthorizedClient = () => ({
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: null },
      error: { message: "Unauthorized" },
    }),
  },
});

const nonAdminClient = () => {
  const maybeSingle = jest.fn().mockResolvedValue({
    data: { submission_role: "project_manager" },
    error: null,
  });
  const eq = jest.fn().mockReturnValue({ maybeSingle });
  const select = jest.fn().mockReturnValue({ eq });
  const from = jest.fn().mockReturnValue({ select });

  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: authedUser },
        error: null,
      }),
    },
    from,
  };
};

describe("API route security coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckRateLimit.mockReturnValue(null);
  });

  it("covers auth POST invalid action", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        signUp: jest.fn(),
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
      },
    });

    const response = await authRoute.POST(
      makeRequest({
        body: { email: "u@example.com", password: "pw", action: "bad-action" },
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Invalid action");
  });

  it("covers auth GET unauthorized", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "not authenticated" },
        }),
      },
    });

    const response = await authRoute.GET(makeRequest());
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toBe("not authenticated");
  });

  it("covers users GET unauthorized", async () => {
    mockCreateClient.mockResolvedValue(unauthorizedClient());

    const response = await usersRoute.GET(makeRequest());
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toBe("Unauthorized");
  });

  it("covers users/[id] GET forbidden for cross-user read", async () => {
    mockCreateClient.mockResolvedValue(nonAdminClient());

    const response = await userByIdRoute.GET(
      makeRequest(),
      { params: Promise.resolve({ id: "another-user" }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error).toBe("Forbidden");
  });

  it("covers admin/proxy unauthorized", async () => {
    mockCreateClient.mockResolvedValue(unauthorizedClient());

    const response = await adminProxyRoute.POST(
      makeRequest({
        body: {
          table: "users",
          action: "select",
          data: { select: "*" },
        },
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toBe("Unauthorized");
  });

  it("covers admin/proxy forbidden for non-admin caller", async () => {
    mockCreateClient.mockResolvedValue(nonAdminClient());

    const response = await adminProxyRoute.POST(
      makeRequest({
        body: {
          table: "tenants",
          action: "select",
          data: { select: "*" },
        },
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error).toBe("Forbidden");
  });

  it("covers admin/users/invite unauthorized", async () => {
    mockCreateClient.mockResolvedValue(unauthorizedClient());

    const response = await inviteRoute.POST(
      makeRequest({
        body: {
          name: "User One",
          email: "user1@example.com",
          phone: "123-123-1234",
          submission_role: "project_manager",
          privilege: "user",
        },
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toBe("Unauthorized");
  });

  it("covers admin/users/invite forbidden for non-admin caller", async () => {
    mockCreateClient.mockResolvedValue(nonAdminClient());

    const response = await inviteRoute.POST(
      makeRequest({
        body: {
          name: "User One",
          email: "user1@example.com",
          phone: "123-123-1234",
          submission_role: "project_manager",
          privilege: "user",
        },
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error).toBe("Forbidden");
  });

  it("covers admin/users/resend-invite unauthorized", async () => {
    mockCreateClient.mockResolvedValue(unauthorizedClient());

    const response = await resendInviteRoute.POST(
      makeRequest({
        body: {
          userId: "target-user-id",
        },
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toBe("Unauthorized");
  });

  it("covers admin/users/resend-invite forbidden for non-admin caller", async () => {
    mockCreateClient.mockResolvedValue(nonAdminClient());

    const response = await resendInviteRoute.POST(
      makeRequest({
        body: {
          userId: "target-user-id",
        },
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error).toBe("Forbidden");
  });

  it("covers health GET healthy path", async () => {
    const limit = jest.fn().mockResolvedValue({ error: null });
    const select = jest.fn().mockReturnValue({ limit });
    const from = jest.fn().mockReturnValue({ select });
    mockCreateClient.mockResolvedValue({ from });

    const response = await healthRoute.GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.status).toBe("healthy");
    expect(payload.database).toBe("connected");
  });
});
