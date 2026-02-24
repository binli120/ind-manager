import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SendNotificationDialog } from "@/components/notifications/SendNotificationDialog";
import { sendNotification } from "@/lib/store/slices/notificationsSlice";

const dispatchMock = jest.fn();
const unwrapMock = jest.fn();

jest.mock("@/lib/store", () => ({
  useAppDispatch: () => dispatchMock,
}));

jest.mock("@/lib/store/slices/notificationsSlice", () => ({
  sendNotification: jest.fn(),
}));

describe("SendNotificationDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    dispatchMock.mockReturnValue({ unwrap: unwrapMock });
    unwrapMock.mockResolvedValue({ recipients: 3, unresolvedHandles: [] });
    (sendNotification as jest.Mock).mockImplementation((args) => ({
      type: "notifications/send",
      payload: args,
    }));
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

  it("dispatches a system notification payload", async () => {
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
      expect(sendNotification).toHaveBeenCalledTimes(1);
      expect(dispatchMock).toHaveBeenCalledTimes(1);
    });

    const [args] = (sendNotification as jest.Mock).mock.calls[0] as [{
      request: {
        scope: string;
        title: string;
        channels: { inApp: boolean; email: boolean };
        sourceType: string;
      };
      refreshUserId: string;
    }];

    expect(args.refreshUserId).toBe("u-admin");
    expect(args.request).toMatchObject({
      scope: "system",
      title: "Platform maintenance",
      sourceType: "manual",
      channels: { inApp: true, email: false },
      skipActor: true,
      type: "system_alert",
    });

    expect(
      await screen.findByText("Sent to 3 recipient(s)."),
    ).toBeInTheDocument();
  });

  it("shows dispatch failure message", async () => {
    unwrapMock.mockRejectedValueOnce("Failed to send notification");

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

    expect(
      await screen.findByText("Failed to send notification"),
    ).toBeInTheDocument();
  });
});
