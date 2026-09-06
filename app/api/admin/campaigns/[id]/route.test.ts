import { beforeEach, describe, expect, it, vi } from "vitest";
import { PATCH } from "@/app/api/admin/campaigns/[id]/route";
import { requireCampaignMembership } from "@/lib/organizer-auth";

vi.mock("@/lib/organizer-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/organizer-auth")>();
  return {
    ...actual,
    requireCampaignMembership: vi.fn(),
    organizerAuthStatus: vi.fn((error: { status?: number }) => error?.status ?? null),
  };
});

const membership = vi.mocked(requireCampaignMembership);
const validBody = {
  title: " חלוקת משניות ",
  in_memory_of: "פלוני",
  subtitle: "",
  instructions: "",
  photo_url: "https://example.com/photo.jpg",
  theme: "navy",
  deadline: "",
};

function request(body: unknown) {
  return new Request("http://localhost/api/admin/campaigns/7", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function client(result: { data: unknown; error: unknown } = { data: { id: 7 }, error: null }) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};
  builder.update = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.select = vi.fn(() => builder);
  builder.maybeSingle = vi.fn().mockResolvedValue(result);
  return { client: { from: vi.fn(() => builder) }, builder };
}

describe("PATCH /api/admin/campaigns/[id]", () => {
  beforeEach(() => membership.mockReset());

  it("AC-ACCESS-006 rejects invalid campaign scope before authorization", async () => {
    for (const id of ["../7", "0", "1.5"]) {
      const response = await PATCH(request(validBody), {
        params: Promise.resolve({ id }),
      });
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "invalid_campaign" });
    }
    expect(membership).not.toHaveBeenCalled();
  });

  it("AC-ACCESS-007 updates only validated campaign fields for a member", async () => {
    const { client: supabase, builder } = client();
    membership.mockResolvedValue({ supabase, user: {}, membership: {} } as never);
    const response = await PATCH(request(validBody), {
      params: Promise.resolve({ id: "7" }),
    });
    expect(response.status).toBe(200);
    expect(builder.update).toHaveBeenCalledWith({
      ...validBody,
      title: "חלוקת משניות",
    });
    expect(supabase.from).toHaveBeenCalledWith("campaigns");
    expect(builder.eq).toHaveBeenCalledWith("id", 7);
    expect(builder.select).toHaveBeenCalledWith("id");
    expect(await response.json()).toEqual({ ok: true });
  });

  it("RISK-ACCESS-008 rejects insecure image URLs before authorization", async () => {
    const response = await PATCH(
      request({ ...validBody, photo_url: "http://tracker.example/image" }),
      { params: Promise.resolve({ id: "7" }) }
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("invalid_input");
    expect(body.fields.photo_url).toBeDefined();
    expect(membership).not.toHaveBeenCalled();
  });

  it("reports malformed JSON and database failures", async () => {
    const malformed = await PATCH(
      new Request("http://localhost/api/admin/campaigns/7", {
        method: "PATCH",
        body: "{",
      }),
      { params: Promise.resolve({ id: "7" }) }
    );
    expect(malformed.status).toBe(400);
    expect(await malformed.json()).toEqual({ error: "invalid_json" });

    const failed = client({ data: null, error: new Error("update failed") });
    membership.mockResolvedValueOnce({ supabase: failed.client } as never);
    const errorResponse = await PATCH(request(validBody), {
      params: Promise.resolve({ id: "7" }),
    });
    expect(errorResponse.status).toBe(500);
    expect(await errorResponse.json()).toEqual({ error: "update failed" });

    const missing = client({ data: null, error: null });
    membership.mockResolvedValueOnce({ supabase: missing.client } as never);
    const missingResponse = await PATCH(request(validBody), {
      params: Promise.resolve({ id: "7" }),
    });
    expect(missingResponse.status).toBe(404);
    expect(await missingResponse.json()).toEqual({ error: "campaign_not_found" });
  });

  it("maps organizer authorization and unexpected failures", async () => {
    membership.mockRejectedValueOnce({ status: 401, message: "unauthenticated" });
    const unauthenticated = await PATCH(request(validBody), {
      params: Promise.resolve({ id: "7" }),
    });
    expect(unauthenticated.status).toBe(401);
    expect(await unauthenticated.json()).toEqual({ error: "unauthenticated" });

    membership.mockRejectedValueOnce({ status: 403, message: "forbidden" });
    const forbidden = await PATCH(request(validBody), {
      params: Promise.resolve({ id: "7" }),
    });
    expect(forbidden.status).toBe(403);
    expect(await forbidden.json()).toEqual({ error: "forbidden" });

    membership.mockRejectedValueOnce(new Error("unexpected"));
    const unexpected = await PATCH(request(validBody), {
      params: Promise.resolve({ id: "7" }),
    });
    expect(unexpected.status).toBe(500);
    expect(await unexpected.json()).toEqual({ error: "unexpected" });

    membership.mockRejectedValueOnce("raw failure");
    const raw = await PATCH(request(validBody), {
      params: Promise.resolve({ id: "7" }),
    });
    expect(raw.status).toBe(500);
    expect(await raw.json()).toEqual({ error: "unknown_error" });
  });
});
