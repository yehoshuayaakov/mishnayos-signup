import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isEmailRemindersEnabled } from "@/lib/email-reminder-availability";

describe("isEmailRemindersEnabled", () => {
  beforeEach(() => {
    vi.stubEnv("ENABLE_EMAIL_REMINDERS", "true");
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("RESEND_FROM", "Mishnayos <reminders@example.com>");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("AC-BIALA-010 enables reminders only with the explicit flag and provider config", () => {
    expect(isEmailRemindersEnabled()).toBe(true);
  });

  it.each(["ENABLE_EMAIL_REMINDERS", "RESEND_API_KEY", "RESEND_FROM"] as const)(
    "RISK-BIALA-003 fails closed when %s is empty",
    (key) => {
      vi.stubEnv(key, "");
      expect(isEmailRemindersEnabled()).toBe(false);
    }
  );

  it.each(["false", "TRUE", "1"])(
    "RISK-BIALA-003 rejects the non-explicit flag value %s",
    (value) => {
      vi.stubEnv("ENABLE_EMAIL_REMINDERS", value);
      expect(isEmailRemindersEnabled()).toBe(false);
    }
  );

  it.each(["RESEND_API_KEY", "RESEND_FROM"] as const)(
    "RISK-BIALA-003 treats whitespace-only %s as missing",
    (key) => {
      vi.stubEnv(key, "   ");
      expect(isEmailRemindersEnabled()).toBe(false);
    }
  );

  it.each(["RESEND_API_KEY", "RESEND_FROM"] as const)(
    "RISK-BIALA-003 fails closed when %s is absent",
    (key) => {
      delete process.env[key];
      expect(isEmailRemindersEnabled()).toBe(false);
    }
  );
});
