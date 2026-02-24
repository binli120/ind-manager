import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SendNotificationDialog } from "@/components/notifications/SendNotificationDialog";

describe("SendNotificationDialog", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("does not render for non-admin users", () => {
    render(
      <SendNotificationDialog
        currentUser={{
          id: "u1",
          email: "user@example.com",
          role: "guest",
          privilege: "user",
        }}
        projects={[]}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Send notification" }),
    ).not.toBeInTheDocument();
  });

  it("submits a system notification payload", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ recipients: 3, unresolvedHandles: [] }),
    } as Response);

    render(
      <SendNotificationDialog
        currentUser={{
          id: "u-admin",
          email: "admin@filynai.com",
          role: "admin",
          privilege: "admin",
        }}
        projects={[{ id: "p1", title: "Project Alpha", code: "ALP" }]}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Send notification" }),
    );

    await userEvent.type(
      screen.getByPlaceholderText("Notification title"),
      "Platform maintenance",
    );

    await userEvent.click(screen.getByRole("button", { name: /^Send$/ }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    const [url, request] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("/api/notifications");
    expect(request.method).toBe("POST");

    const parsed = JSON.parse(request.body as string) as {
      scope: string;
      title: string;
      channels: { inApp: boolean; email: boolean };
      sourceType: string;
    };

    expect(parsed).toMatchObject({
      scope: "system",
      title: "Platform maintenance",
      sourceType: "manual",
      channels: { inApp: true, email: false },
    });

    expect(
      await screen.findByText("Sent to 3 recipient(s)."),
    ).toBeInTheDocument();
  });
});
