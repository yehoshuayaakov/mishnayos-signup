import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/campaigns/[slug]/claim/route";
import { getCampaign } from "@/lib/campaign";
import { isEmailRemindersEnabled } from "@/lib/email-reminder-availability";
import { getSupabase } from "@/lib/supabase";
import { claimWithOptionalReminder } from "@/lib/reminder-job";
import { isVoiceRemindersEnabled } from "@/lib/voice";

vi.mock("@/lib/campaign", () => ({
  getCampaign: vi.fn(),
}));
vi.mock("@/lib/supabase", () => ({
  getSupabase: vi.fn(),
}));
vi.mock("@/lib/email-reminder-availability", () => ({
  isEmailRemindersEnabled: vi.fn(),
}));
vi.mock("@/lib/reminder-job", () => ({
  claimWithOptionalReminder: vi.fn(),
}));
vi.mock("@/lib/voice", () => ({
  isVoiceRemindersEnabled: vi.fn(),
}));

const campaign = vi.mocked(getCampaign);
const remindersEnabled = vi.mocked(isEmailRemindersEnabled);
const supabase = vi.mocked(getSupabase);
const claim = vi.mocked(claimWithOptionalReminder);
const voiceEnabled = vi.mocked(isVoiceRemindersEnabled);

function req(body: unknown) {
  return new Request("http://localhost/api/campaigns/e2e/claim", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function malformedReq() {
  return new Request("http://localhost/api/campaigns/e2e/claim", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{",
  });
}

const ctx = { params: Promise.resolve({ slug: "e2e" }) };

describe("POST /api/campaigns/[slug]/claim", () => {
  beforeEach(() => {
    campaign.mockReset();
    supabase.mockReset();
    claim.mockReset();
    remindersEnabled.mockReset();
    voiceEnabled.mockReset();
    remindersEnabled.mockReturnValue(true);
    voiceEnabled.mockReturnValue(false);
    campaign.mockResolvedValue({
      id: 1,
      slug: "e2e",
      title: "t",
      in_memory_of: "n",
      subtitle: "",
      deadline: "",
      deadline_at: "2027-01-01T00:00:00.000Z",
      timezone: "Asia/Jerusalem",
      instructions: "",
      photo_url: "",
      theme: "navy",
      is_active: true,
    });
    supabase.mockReturnValue({} as never);
    claim.mockResolvedValue({ status: "ok" });
  });

  it("rejects an empty claimant name", async () => {
    const res = await POST(req({ id: 1, name: "   " }), ctx);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_name" });
  });

  it("rejects malformed JSON and invalid tractate ids", async () => {
    const malformed = await POST(malformedReq(), ctx);
    expect(malformed.status).toBe(400);
    expect(await malformed.json()).toEqual({ error: "invalid_json" });

    for (const id of [undefined, "1", 1.5]) {
      const invalidId = await POST(req({ id, name: "דוד" }), ctx);
      expect(invalidId.status).toBe(400);
      expect(await invalidId.json()).toEqual({ error: "invalid_input" });
    }
    expect(campaign).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown campaign before reminder validation", async () => {
    campaign.mockResolvedValue(null);

    const res = await POST(
      req({ id: 1, name: "דוד", reminders: true, cadence: "invalid" }),
      ctx
    );

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "campaign_not_found" });
    expect(supabase).not.toHaveBeenCalled();
  });

  it("requires a valid email when reminders are enabled", async () => {
    const missing = await POST(
      req({ id: 1, name: "דוד", reminders: true, cadence: "weekly", email: "" }),
      ctx
    );
    expect(missing.status).toBe(400);
    expect(await missing.json()).toEqual({ error: "email_required" });

    const invalid = await POST(
      req({ id: 1, name: "דוד", reminders: true, cadence: "weekly", email: "bad" }),
      ctx
    );
    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toEqual({ error: "invalid_email" });
  });

  it("RISK-BIALA-001 rejects reminder enrollment before claim execution when disabled", async () => {
    remindersEnabled.mockReturnValue(false);

    const res = await POST(
      req({
        id: 1,
        name: "דוד",
        reminders: true,
        cadence: "weekly",
        email: "a@b.com",
      }),
      ctx
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "reminders_unavailable" });
    expect(supabase).not.toHaveBeenCalled();
    expect(claim).not.toHaveBeenCalled();
  });

  it("AC-BIALA-009 allows an ordinary claim while reminders are disabled", async () => {
    remindersEnabled.mockReturnValue(false);

    const res = await POST(req({ id: 1, name: "דוד" }), ctx);

    expect(res.status).toBe(200);
    expect(claim).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ reminder: null })
    );
  });

  it("rejects voice when Twilio is not configured", async () => {
    const res = await POST(
      req({
        id: 1,
        name: "דוד",
        reminders: true,
        cadence: "weekly",
        email: "a@b.com",
        sendVoice: true,
        phone: "+972501234567",
      }),
      ctx
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "voice_unavailable" });
  });

  it("rejects week_before when the campaign has no deadline_at", async () => {
    campaign.mockResolvedValue({
      id: 1,
      slug: "e2e",
      title: "t",
      in_memory_of: "n",
      subtitle: "",
      deadline: "",
      deadline_at: null,
      timezone: "Asia/Jerusalem",
      instructions: "",
      photo_url: "",
      theme: "navy",
      is_active: true,
    });
    const res = await POST(
      req({
        id: 1,
        name: "דוד",
        reminders: true,
        cadence: "week_before",
        sendEmail: true,
        email: "a@b.com",
      }),
      ctx
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "deadline_required" });
  });

  it("allows ordinary and daily-reminder claims when no deadline is configured", async () => {
    campaign.mockResolvedValue({
      id: 1,
      slug: "e2e",
      title: "t",
      in_memory_of: "n",
      subtitle: "",
      deadline: "",
      deadline_at: null,
      timezone: "Asia/Jerusalem",
      instructions: "",
      photo_url: "",
      theme: "navy",
      is_active: true,
    });

    const ordinary = await POST(req({ id: 1, name: "דוד" }), ctx);
    expect(ordinary.status).toBe(200);

    const daily = await POST(
      req({
        id: 2,
        name: "שרה",
        reminders: true,
        cadence: "daily",
        email: "a@b.com",
      }),
      ctx
    );
    expect(daily.status).toBe(200);
  });

  it("returns 409 when the tractate is already claimed", async () => {
    claim.mockResolvedValue({ status: "already_claimed" });
    const res = await POST(req({ id: 1, name: "דוד" }), ctx);
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "already_claimed" });
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it.each([
    [new Error("missing_config"), "missing_config"],
    ["raw_config_failure", "unknown_error"],
  ])("maps service-client configuration failures", async (failure, expected) => {
    supabase.mockImplementation(() => {
      throw failure;
    });

    const res = await POST(req({ id: 1, name: "דוד" }), ctx);

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: expected });
    expect(claim).not.toHaveBeenCalled();
  });

  it.each([
    [new Error("rpc_failed"), "rpc_failed"],
    ["raw_rpc_failure", "unknown_error"],
  ])("maps claim transaction failures", async (failure, expected) => {
    claim.mockRejectedValue(failure);

    const res = await POST(req({ id: 1, name: "דוד" }), ctx);

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: expected });
  });

  it("AC-ACCESS-001 stores a hash and issues a 15-minute HttpOnly capability cookie", async () => {
    const res = await POST(req({ id: 1, name: "דוד" }), ctx);
    expect(res.status).toBe(200);
    expect(claim).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        claimEditTokenHash: expect.stringMatching(/^[0-9a-f]{64}$/),
      })
    );
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("claim-edit-e2e-1=");
    expect(cookie).toContain("Max-Age=900");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("HttpOnly");
    expect(cookie.toLowerCase()).toContain("samesite=lax");
  });

  it("returns manageUrl when reminders were stored", async () => {
    claim.mockResolvedValue({ status: "ok", manageUrl: "http://localhost:3000/reminders/abc" });
    const res = await POST(
      req({
        id: 1,
        name: "דוד",
        reminders: true,
        cadence: "weekly",
        sendEmail: true,
        email: "a@b.com",
      }),
      ctx
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: true,
      manageUrl: "http://localhost:3000/reminders/abc",
    });
  });
});
