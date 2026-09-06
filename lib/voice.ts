import twilio from "twilio";
import { getAppUrl } from "@/lib/app-url";
import type { ReminderLocale } from "@/lib/reminders";

function twilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
  );
}

export function isTwilioConfigured(): boolean {
  return twilioConfigured();
}

export function isVoiceRemindersEnabled(): boolean {
  return process.env.ENABLE_VOICE_REMINDERS === "true" && twilioConfigured();
}

export async function placeReminderCall(opts: {
  to: string;
  reminderId: number;
}): Promise<{ ok: true; sid: string } | { ok: false; retryable: boolean; error: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) {
    return { ok: false, retryable: false, error: "voice_not_configured" };
  }
  const client = twilio(sid, token);
  const url = `${getAppUrl()}/api/voice/reminder?id=${opts.reminderId}`;
  try {
    const call = await client.calls.create({
      to: opts.to,
      from,
      url,
      method: "GET",
    });
    return { ok: true, sid: call.sid };
  } catch (err) {
    const code = (err as { code?: number }).code;
    const message = err instanceof Error ? err.message : "voice_error";
    // 4xx-style Twilio error codes should not be retried every hour.
    const retryable = code === undefined || code < 20000 || code >= 30000;
    return { ok: false, retryable, error: message };
  }
}

/** Reconstruct the public URL Twilio signed (honors forwarded proto/host on Vercel). */
export function publicRequestUrl(req: Request): string {
  const url = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || url.host;
  const proto = req.headers.get("x-forwarded-proto") || url.protocol.replace(":", "") || "https";
  return `${proto}://${host}${url.pathname}${url.search}`;
}

export function validateTwilioSignature(req: Request): boolean {
  const token = process.env.TWILIO_AUTH_TOKEN;
  const signature = req.headers.get("x-twilio-signature");
  if (!token || !signature) return false;
  return twilio.validateRequest(token, signature, publicRequestUrl(req), {});
}

export function reminderTwiml(opts: { locale: ReminderLocale; script: string }): string {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();
  if (opts.locale === "he") {
    // Twilio SDK v6 no longer types Polly.Carmit; default he-IL voice is used.
    response.say({ language: "he-IL" }, opts.script);
  } else {
    response.say({ language: "en-US", voice: "Polly.Joanna" }, opts.script);
  }
  return response.toString();
}
