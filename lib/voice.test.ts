import { afterEach, describe, expect, it } from "vitest";
import twilio from "twilio";
import {
  isVoiceRemindersEnabled,
  publicRequestUrl,
  validateTwilioSignature,
} from "@/lib/voice";

afterEach(() => {
  delete process.env.ENABLE_VOICE_REMINDERS;
  delete process.env.TWILIO_ACCOUNT_SID;
  delete process.env.TWILIO_AUTH_TOKEN;
  delete process.env.TWILIO_PHONE_NUMBER;
});

describe("isVoiceRemindersEnabled", () => {
  it("requires both the explicit release flag and every Twilio credential", () => {
    process.env.TWILIO_ACCOUNT_SID = "ACtest";
    process.env.TWILIO_AUTH_TOKEN = "token";
    process.env.TWILIO_PHONE_NUMBER = "+15551234567";
    expect(isVoiceRemindersEnabled()).toBe(false);

    process.env.ENABLE_VOICE_REMINDERS = "true";
    expect(isVoiceRemindersEnabled()).toBe(true);
  });
});

describe("publicRequestUrl", () => {
  it("prefers forwarded proto and host so Vercel matches the Twilio signature URL", () => {
    const req = new Request("http://127.0.0.1/api/voice/reminder?id=3", {
      headers: {
        host: "127.0.0.1",
        "x-forwarded-proto": "https",
        "x-forwarded-host": "app.example.com",
      },
    });
    expect(publicRequestUrl(req)).toBe("https://app.example.com/api/voice/reminder?id=3");
  });
});

describe("validateTwilioSignature", () => {
  it("rejects unsigned requests (TwiML must not be enumerable)", () => {
    process.env.TWILIO_AUTH_TOKEN = "test-token";
    const req = new Request("https://app.example.com/api/voice/reminder?id=1");
    expect(validateTwilioSignature(req)).toBe(false);
  });

  it("accepts a signature Twilio would produce for the public URL", () => {
    const token = "test-token";
    process.env.TWILIO_AUTH_TOKEN = token;
    const url = "https://app.example.com/api/voice/reminder?id=1";
    const signature = twilio.getExpectedTwilioSignature(token, url, {});
    const req = new Request(url, {
      headers: { "x-twilio-signature": signature, host: "app.example.com" },
    });
    expect(validateTwilioSignature(req)).toBe(true);
  });
});
