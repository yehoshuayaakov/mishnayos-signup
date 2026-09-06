import { beforeEach, describe, expect, it, vi } from "vitest";
import { PATCH } from "@/app/api/admin/campaigns/[id]/tractates/[tractateId]/route";
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
const context = {
  params: Promise.resolve({ id: "7", tractateId: "11" }),
};

function request(body: unknown) {
  return new Request("http://localhost/api/admin/campaigns/7/tractates/11", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function serviceClient({
  renameResult = { data: { id: 11 }, error: null },
  rpcResult = { data: "ok", error: null },
}: {
  renameResult?: { data: unknown; error: unknown };
  rpcResult?: { data: unknown; error: unknown };
} = {}) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};
  builder.update = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.not = vi.fn(() => builder);
  builder.select = vi.fn(() => builder);
  builder.maybeSingle = vi.fn().mockResolvedValue(renameResult);
  return {
    from: vi.fn(() => builder),
    rpc: vi.fn().mockResolvedValue(rpcResult),
    builder,
  };
}

describe("PATCH organizer tractate", () => {
  beforeEach(() => membership.mockReset());

  it("RISK-ACCESS-003 rejects unknown actions before campaign access", async () => {
    const response = await PATCH(request({ action: "delete" }), context);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_input" });
    expect(membership).not.toHaveBeenCalled();
  });

  it("rejects malformed ids and JSON before campaign access", async () => {
    for (const params of [
      { id: "0", tractateId: "11" },
      { id: "7", tractateId: "0" },
      { id: "1.5", tractateId: "11" },
      { id: "7", tractateId: "1.5" },
    ]) {
      const response = await PATCH(request({ action: "release" }), {
        params: Promise.resolve(params),
      });
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "invalid_input" });
    }

    const malformed = await PATCH(
      new Request("http://localhost/api/admin/campaigns/7/tractates/11", {
        method: "PATCH",
        body: "{",
      }),
      context
    );
    expect(malformed.status).toBe(400);
    expect(await malformed.json()).toEqual({ error: "invalid_json" });
    expect(membership).not.toHaveBeenCalled();
  });

  it("AC-ACCESS-008 renames a claimed tractate within the authorized campaign", async () => {
    const supabase = serviceClient();
    membership.mockResolvedValue({ supabase, user: {}, membership: {} } as never);
    const response = await PATCH(
      request({ action: "rename", name: " שרה " }),
      context
    );
    expect(response.status).toBe(200);
    expect(supabase.builder.update).toHaveBeenCalledWith({ claimed_by: "שרה" });
    expect(supabase.from).toHaveBeenCalledWith("tractates");
    expect(supabase.builder.eq).toHaveBeenNthCalledWith(1, "id", 11);
    expect(supabase.builder.eq).toHaveBeenCalledWith("campaign_id", 7);
    expect(supabase.builder.not).toHaveBeenCalledWith("claimed_by", "is", null);
    expect(supabase.builder.select).toHaveBeenCalledWith("id");
    expect(await response.json()).toEqual({ ok: true });
  });

  it("RISK-ACCESS-005 uses the atomic release RPC and returns no private data", async () => {
    const supabase = serviceClient();
    membership.mockResolvedValue({ supabase, user: {}, membership: {} } as never);
    const response = await PATCH(request({ action: "release" }), context);
    expect(response.status).toBe(200);
    expect(supabase.rpc).toHaveBeenCalledWith("release_tractate", {
      p_tractate_id: 11,
      p_campaign_id: 7,
    });
    expect(await response.json()).toEqual({ ok: true });
  });

  it("reports release and rename database failures", async () => {
    const releaseError = serviceClient({
      rpcResult: { data: null, error: new Error("release failed") },
    });
    membership.mockResolvedValueOnce({ supabase: releaseError } as never);
    const releaseFailure = await PATCH(request({ action: "release" }), context);
    expect(releaseFailure.status).toBe(500);
    expect(await releaseFailure.json()).toEqual({ error: "release failed" });

    const alreadyOpen = serviceClient({
      rpcResult: { data: "not_claimed", error: null },
    });
    membership.mockResolvedValueOnce({ supabase: alreadyOpen } as never);
    const openResponse = await PATCH(request({ action: "release" }), context);
    expect(openResponse.status).toBe(404);
    expect(await openResponse.json()).toEqual({ error: "not_claimed" });

    const renameError = serviceClient({
      renameResult: { data: null, error: new Error("rename failed") },
    });
    membership.mockResolvedValueOnce({ supabase: renameError } as never);
    const renameFailure = await PATCH(
      request({ action: "rename", name: "שרה" }),
      context
    );
    expect(renameFailure.status).toBe(500);
    expect(await renameFailure.json()).toEqual({ error: "rename failed" });

    const noClaim = serviceClient({ renameResult: { data: null, error: null } });
    membership.mockResolvedValueOnce({ supabase: noClaim } as never);
    const noClaimResponse = await PATCH(
      request({ action: "rename", name: "שרה" }),
      context
    );
    expect(noClaimResponse.status).toBe(404);
    expect(await noClaimResponse.json()).toEqual({ error: "not_claimed" });
  });

  it("maps organizer authorization and unexpected failures", async () => {
    membership.mockRejectedValueOnce({ status: 401, message: "unauthenticated" });
    const unauthenticated = await PATCH(request({ action: "release" }), context);
    expect(unauthenticated.status).toBe(401);
    expect(await unauthenticated.json()).toEqual({ error: "unauthenticated" });

    membership.mockRejectedValueOnce({ status: 403, message: "forbidden" });
    const forbidden = await PATCH(request({ action: "release" }), context);
    expect(forbidden.status).toBe(403);
    expect(await forbidden.json()).toEqual({ error: "forbidden" });

    membership.mockRejectedValueOnce(new Error("unexpected"));
    const unexpected = await PATCH(request({ action: "release" }), context);
    expect(unexpected.status).toBe(500);
    expect(await unexpected.json()).toEqual({ error: "unexpected" });

    membership.mockRejectedValueOnce("raw failure");
    const raw = await PATCH(request({ action: "release" }), context);
    expect(raw.status).toBe(500);
    expect(await raw.json()).toEqual({ error: "unknown_error" });
  });
});
