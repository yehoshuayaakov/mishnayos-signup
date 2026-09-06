import { describe, expect, it } from "vitest";
import { confirmationCopy, reminderEmailCopy, tractateLabel } from "@/lib/reminder-copy";

describe("tractateLabel", () => {
  it("uses English when locale is en and name_en is set", () => {
    expect(tractateLabel("en", "ברכות", "Berachos")).toBe("Berachos");
    expect(tractateLabel("he", "ברכות", "Berachos")).toBe("ברכות");
    expect(tractateLabel("en", "ברכות", "")).toBe("ברכות");
  });
});

describe("email copy escaping", () => {
  it("escapes HTML in confirmation copy so names cannot inject markup", () => {
    const copy = confirmationCopy({
      locale: "en",
      name: '<script>alert(1)</script>',
      tractate: "Berachos",
      niftar: "Test",
      manageUrl: "https://example.com/reminders/abc",
    });
    expect(copy.html).not.toContain("<script>");
    expect(copy.html).toContain("&lt;script&gt;");
  });

  it("escapes HTML in reminder emails", () => {
    const copy = reminderEmailCopy({
      locale: "he",
      name: "A",
      tractate: "B",
      niftar: '<img src=x>',
      deadline: "",
      manageUrl: "https://example.com/x",
    });
    expect(copy.html).not.toContain("<img");
    expect(copy.html).toContain("&lt;img");
  });
});
