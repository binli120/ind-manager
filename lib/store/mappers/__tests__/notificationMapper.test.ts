import {
  countUnreadNotifications,
  mapNotificationRecipientToItem,
  mapNotificationRecipientsToItems,
} from "../notificationMapper";

describe("notificationMapper", () => {
  it("maps recipient row to notification item", () => {
    const item = mapNotificationRecipientToItem({
      id: "r1",
      user_id: "u1",
      is_read: false,
      notification: {
        id: "n1",
        type: "mention",
        title: "Mention",
        creator: { name: "Alice" },
      },
    });

    expect(item.event_id).toBe("n1");
    expect(item.from).toBe("Alice");
    expect(item.type).toBe("mention");
  });

  it("maps list and counts unread", () => {
    const items = mapNotificationRecipientsToItems([
      { id: "r1", user_id: "u1", is_read: false },
      { id: "r2", user_id: "u1", is_read: true },
    ]);

    expect(items).toHaveLength(2);
    expect(countUnreadNotifications(items)).toBe(1);
  });
});
