import { z } from "zod";

export const CADENCES = ["daily", "weekly", "week_before"] as const;
export type Cadence = (typeof CADENCES)[number];

export const LOCALES = ["he", "en"] as const;
export type ReminderLocale = (typeof LOCALES)[number];

export type ReminderInput = {
  cadence: Cadence;
  sendEmail: boolean;
  sendVoice: boolean;
  locale: ReminderLocale;
  email: string | null;
  phoneE164: string | null;
};

export const reminderEmailSchema = z
  .string()
  .trim()
  .min(1, "נא למלא כתובת אימייל.")
  .max(120, "כתובת האימייל אינה תקינה.")
  .email("כתובת האימייל אינה תקינה.");

export function isCadence(value: unknown): value is Cadence {
  return typeof value === "string" && (CADENCES as readonly string[]).includes(value);
}

export function isReminderLocale(value: unknown): value is ReminderLocale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function normalizeEmail(raw: unknown): string | null {
  const parsed = reminderEmailSchema.safeParse(raw);
  return parsed.success ? parsed.data.toLowerCase() : null;
}

export function normalizePhone(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let s = raw.trim().replace(/[\s\-().]/g, "");
  if (!s) return null;
  if (s.startsWith("00")) s = `+${s.slice(2)}`;
  if (s.startsWith("0") && /^\d{9,10}$/.test(s)) s = `+972${s.slice(1)}`;
  if (!s.startsWith("+") && /^972\d{8,10}$/.test(s)) s = `+${s}`;
  if (!/^\+[1-9]\d{7,14}$/.test(s)) return null;
  return s;
}

export type ParseReminderResult =
  | { ok: true; reminder: ReminderInput | null }
  | { ok: false; error: string };

/** Parse optional reminder fields from a claim JSON body. */
export function parseReminderFields(body: {
  reminders?: unknown;
  cadence?: unknown;
  sendEmail?: unknown;
  sendVoice?: unknown;
  locale?: unknown;
  email?: unknown;
  phone?: unknown;
}): ParseReminderResult {
  if (body.reminders !== true) return { ok: true, reminder: null };

  if (!isCadence(body.cadence)) return { ok: false, error: "invalid_cadence" };

  const sendVoice = body.sendVoice === true;

  const locale = isReminderLocale(body.locale) ? body.locale : "he";
  const email = normalizeEmail(body.email);
  const phoneE164 = normalizePhone(body.phone);

  if (typeof body.email !== "string" || !body.email.trim()) {
    return { ok: false, error: "email_required" };
  }
  if (!email) return { ok: false, error: "invalid_email" };
  if (sendVoice && !phoneE164) return { ok: false, error: "phone_required" };
  if (body.phone && typeof body.phone === "string" && body.phone.trim() && !phoneE164) {
    return { ok: false, error: "invalid_phone" };
  }

  return {
    ok: true,
    reminder: {
      cadence: body.cadence,
      sendEmail: true,
      sendVoice,
      locale,
      email,
      phoneE164,
    },
  };
}
