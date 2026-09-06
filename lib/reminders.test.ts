import { describe, expect, it } from "vitest";
import { normalizeEmail, normalizePhone, parseReminderFields } from "@/lib/reminders";

describe("normalizePhone", () => {
  it("maps Israel local 0… to +972", () => {
    expect(normalizePhone("0501234567")).toBe("+972501234567");
  });

  it("accepts 00 prefix and bare 972", () => {
    expect(normalizePhone("00972501234567")).toBe("+972501234567");
    expect(normalizePhone("972501234567")).toBe("+972501234567");
  });

  it("strips spaces and dashes", () => {
    expect(normalizePhone("+972 50-123-4567")).toBe("+972501234567");
  });

  it("rejects junk", () => {
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("not-a-phone")).toBeNull();
    expect(normalizePhone("+1")).toBeNull();
  });
});

describe("normalizeEmail", () => {
  it("lowercases a valid address", () => {
    expect(normalizeEmail("  A@B.COM ")).toBe("a@b.com");
  });

  it("rejects invalid addresses", () => {
    expect(normalizeEmail("nope")).toBeNull();
    expect(normalizeEmail("")).toBeNull();
  });
});

describe("parseReminderFields", () => {
  it("returns null reminder when opt-in is off", () => {
    expect(parseReminderFields({})).toEqual({ ok: true, reminder: null });
  });

  it("requires a cadence and an email for every reminder", () => {
    expect(parseReminderFields({ reminders: true })).toEqual({ ok: false, error: "invalid_cadence" });
    expect(parseReminderFields({ reminders: true, cadence: "weekly" })).toEqual({
      ok: false,
      error: "email_required",
    });
  });

  it("rejects an invalid reminder email", () => {
    expect(
      parseReminderFields({ reminders: true, cadence: "daily", email: "bad" })
    ).toEqual({ ok: false, error: "invalid_email" });
  });

  it("requires phone when sendVoice is set", () => {
    expect(
      parseReminderFields({
        reminders: true,
        cadence: "weekly",
        email: "a@b.com",
        sendVoice: true,
        phone: "12",
      })
    ).toEqual({ ok: false, error: "phone_required" });
  });

  it("accepts email + weekly Hebrew", () => {
    const parsed = parseReminderFields({
      reminders: true,
      cadence: "weekly",
      sendEmail: true,
      email: "a@b.com",
      locale: "he",
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.reminder).toMatchObject({
        cadence: "weekly",
        sendEmail: true,
        sendVoice: false,
        email: "a@b.com",
        locale: "he",
      });
    }
  });
});
