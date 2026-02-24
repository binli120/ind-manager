import { extractMentionHandles, parseTargetTokens } from "@/lib/notifications/server";

describe("notification server helpers", () => {
  it("extracts unique mention handles from content", () => {
    const handles = extractMentionHandles(
      "Please review this @JaneDoe and @john.smith. Also @janedoe again.",
    );

    expect(handles).toEqual(["janedoe", "john.smith"]);
  });

  it("splits target tokens into handles and user IDs", () => {
    const tokens = parseTargetTokens(
      "@janedoe, 6f6ea665-0902-45c0-97cf-382ecf112dbb; @john_smith",
    );

    expect(tokens.userIds).toEqual(["6f6ea665-0902-45c0-97cf-382ecf112dbb"]);
    expect(tokens.handles).toEqual(["janedoe", "john_smith"]);
  });
});
