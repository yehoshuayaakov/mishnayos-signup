import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { claimWithOptionalReminder, runReminderJob, VOICE_CAP_PER_RUN } from "@/lib/reminder-job";
import { sendEmail } from "@/lib/email";
import { isEmailRemindersEnabled } from "@/lib/email-reminder-availability";
import { isVoiceRemindersEnabled, placeReminderCall } from "@/lib/voice";

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(),
}));
vi.mock("@/lib/email-reminder-availability", () => ({
  isEmailRemindersEnabled: vi.fn(),
}));

vi.mock("@/lib/voice", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/voice")>();
  return {
    ...actual,
    isVoiceRemindersEnabled: vi.fn(),
    placeReminderCall: vi.fn(),
  };
});

const sendEmailMock = vi.mocked(sendEmail);
const remindersEnabled = vi.mocked(isEmailRemindersEnabled);
const twilioOn = vi.mocked(isVoiceRemindersEnabled);
const placeCall = vi.mocked(placeReminderCall);

function reminderRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    email: "a@b.com",
    phone_e164: "+972501234567",
    cadence: "daily",
    send_email: true,
    send_voice: false,
    locale: "he",
    manage_token: "t".repeat(64),
    tractates: { claimed_by: "דוד", name: "ברכות", name_en: "Berachos" },
    campaigns: {
      in_memory_of: "נפטר",
      deadline: "",
      deadline_at: "2027-01-01T00:00:00.000Z",
      timezone: "Asia/Jerusalem",
      is_active: true,
    },
    ...overrides,
  };
}

function supabaseForJob(opts: { rows: unknown[]; already?: boolean; insert?: ReturnType<typeof vi.fn> }) {
  const insert = opts.insert ?? vi.fn().mockResolvedValue({ error: null });
  return {
    rpc: vi.fn(),
    from: vi.fn((table: string) => {
      if (table === "reminders") {
        const builder: Record<string, unknown> = {};
        builder.select = () => builder;
        builder.is = () => Promise.resolve({ data: opts.rows, error: null });
        return builder;
      }
      if (table === "tractates" || table === "campaigns") {
        const builder: Record<string, unknown> = {};
        builder.select = () => builder;
        builder.eq = () => builder;
        builder.maybeSingle = () =>
          Promise.resolve({
            data:
              table === "tractates"
                ? { name: "ברכות", name_en: "Berachos" }
                : { in_memory_of: "נפטר" },
          });
        return builder;
      }
      const builder: Record<string, unknown> = {};
      builder.select = () => builder;
      builder.eq = () => builder;
      builder.maybeSingle = () => Promise.resolve({ data: opts.already ? { id: 9 } : null });
      builder.insert = insert;
      return builder;
    }),
  };
}

describe("claimWithOptionalReminder", () => {
  beforeEach(() => {
    sendEmailMock.mockReset();
    sendEmailMock.mockResolvedValue({ ok: true, id: "msg_1" });
  });

  it("does not send confirmation when there is no email (voice-only still gets manageUrl)", async () => {
    const supabase = supabaseForJob({ rows: [] });
    supabase.rpc.mockResolvedValue({ data: "ok", error: null });
    const result = await claimWithOptionalReminder(supabase as never, {
      tractateId: 1,
      campaignId: 1,
      name: "דוד",
      claimEditTokenHash: "claim-hash",
      reminder: {
        cadence: "weekly",
        sendEmail: false,
        sendVoice: true,
        locale: "he",
        email: null,
        phoneE164: "+972501234567",
      },
    });
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.manageUrl).toMatch(/\/reminders\/[0-9a-f]{64}$/);
    }
    expect(supabase.rpc).toHaveBeenCalledWith(
      "claim_tractate",
      expect.objectContaining({ p_claim_edit_token_hash: "claim-hash" })
    );
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("sends confirmation only when an email is present", async () => {
    const supabase = supabaseForJob({ rows: [] });
    supabase.rpc.mockResolvedValue({ data: "ok", error: null });
    await claimWithOptionalReminder(supabase as never, {
      tractateId: 1,
      campaignId: 1,
      name: "דוד",
      claimEditTokenHash: "claim-hash",
      reminder: {
        cadence: "weekly",
        sendEmail: true,
        sendVoice: false,
        locale: "he",
        email: "a@b.com",
        phoneE164: null,
      },
    });
    await vi.waitFor(() => expect(sendEmailMock).toHaveBeenCalled());
  });
});

describe("runReminderJob", () => {
  beforeEach(() => {
    sendEmailMock.mockReset();
    placeCall.mockReset();
    remindersEnabled.mockReset();
    twilioOn.mockReset();
    sendEmailMock.mockResolvedValue({ ok: true, id: "msg_1" });
    placeCall.mockResolvedValue({ ok: true, sid: "CA1" });
    remindersEnabled.mockReturnValue(true);
    twilioOn.mockReturnValue(true);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-30T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("RISK-BIALA-002 does not query or call providers while reminders are disabled", async () => {
    remindersEnabled.mockReturnValue(false);
    const supabase = supabaseForJob({ rows: [reminderRow()] });

    const stats = await runReminderJob(supabase as never);

    expect(stats).toEqual({ emailed: 0, called: 0, skipped: 0, failed: 0 });
    expect(supabase.from).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(placeCall).not.toHaveBeenCalled();
  });

  it("skips a send that already has a reminder_sends row (idempotent)", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const supabase = supabaseForJob({ rows: [reminderRow()], already: true, insert });
    const stats = await runReminderJob(supabase as never);
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
    expect(stats.emailed).toBe(0);
  });

  it("records a successful email send", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const supabase = supabaseForJob({ rows: [reminderRow()], already: false, insert });
    const stats = await runReminderJob(supabase as never);
    expect(stats.emailed).toBe(1);
    expect(insert).toHaveBeenCalled();
  });

  it("caps voice calls per run", async () => {
    const rows = Array.from({ length: VOICE_CAP_PER_RUN + 3 }, (_, i) =>
      reminderRow({
        id: i + 1,
        send_email: false,
        send_voice: true,
        email: null,
      })
    );
    const supabase = supabaseForJob({ rows, already: false });
    const stats = await runReminderJob(supabase as never);
    expect(placeCall.mock.calls.length).toBe(VOICE_CAP_PER_RUN);
    expect(stats.called).toBe(VOICE_CAP_PER_RUN);
    expect(stats.skipped).toBeGreaterThan(0);
  });
});
