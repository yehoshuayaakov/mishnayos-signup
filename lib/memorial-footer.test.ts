import { describe, expect, it } from "vitest";
import { memorialFooter } from "./campaign";

describe("memorial footer", () => {
  it("uses the feminine line only when the campaign gender is feminine", () => {
    expect(memorialFooter("feminine")).toBe("תהא נשמתה צרורה בצרור החיים");
    expect(memorialFooter("masculine")).toBe("תהא נשמתו צרורה בצרור החיים");
    expect(memorialFooter(undefined)).toBe("תהא נשמתו צרורה בצרור החיים");
  });
});
