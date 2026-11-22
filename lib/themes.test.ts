import { describe, expect, it } from "vitest";
import { themeStyle } from "./themes";

describe("campaign theme style", () => {
  it("keeps burgundy colors off the claim dialog layout", () => {
    const style = themeStyle("burgundy");
    expect(style).toMatchObject({
      "--bg": "#fefcf8",
      "--bg-deep": "#e7d9cc",
    });
    expect(style).not.toHaveProperty("minHeight");
    expect(style).not.toHaveProperty("background");
    expect(style).not.toHaveProperty("backgroundAttachment");
  });
});
