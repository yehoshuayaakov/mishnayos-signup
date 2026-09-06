import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/campaigns/[slug]/edit/route";
import { findCampaignId } from "@/lib/campaign";
import { hashClaimCapability } from "@/lib/claim-capability";
import { getSupabase } from "@/lib/supabase";

vi.mock("@/lib/supabase", () => ({
  getSupabase: vi.fn(),
}));
vi.mock("@/lib/campaign", () => ({
  findCampaignId: vi.fn(),
}));

const campaignId = vi.mocked(findCampaignId);
const serviceClient = vi.mocked(getSupabase);
const rpc = vi.fn();
const context = { params: Promise.resolve({ slug: "e2e" }) };

function request(body: unknown, token?: string) {
  return new NextRequest("http://localhost/api/campaigns/e2e/edit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Cookie: `claim-edit-e2e-1=${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/campaigns/[slug]/edit", () => {
  beforeEach(() => {
    campaignId.mockReset();
    serviceClient.mockReset();
    rpc.mockReset();
    campaignId.mockResolvedValue(10);
    serviceClient.mockReturnValue({ rpc } as never);
  });

  it("AC-ACCESS-004 returns 403 without the claimant capability", async () => {
    const response = await POST(request({ id: 1, action: "release" }), context);
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "forbidden" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON, ids, actions, and rename names", async () => {
    const malformed = await POST(
      new NextRequest("http://localhost/api/campaigns/e2e/edit", {
        method: "POST",
        body: "{",
      }),
      context
    );
    expect(malformed.status).toBe(400);
    expect(await malformed.json()).toEqual({ error: "invalid_json" });

    const invalidId = await POST(
      request({ id: "1", action: "release" }, "secret"),
      context
    );
    expect(invalidId.status).toBe(400);
    expect(await invalidId.json()).toEqual({ error: "invalid_input" });

    const invalidAction = await POST(
      request({ id: 1, action: "delete" }, "secret"),
      context
    );
    expect(invalidAction.status).toBe(400);

    const invalidName = await POST(
      request({ id: 1, action: "rename", name: " " }, "secret"),
      context
    );
    expect(invalidName.status).toBe(400);
    expect(await invalidName.json()).toEqual({ error: "invalid_name" });
  });

  it("AC-ACCESS-003 renames through the capability RPC without changing timestamps", async () => {
    rpc.mockResolvedValue({ data: "ok", error: null });
    const response = await POST(
      request({ id: 1, action: "rename", name: " דוד " }, "secret"),
      context
    );
    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("edit_claim_with_capability", {
      p_tractate_id: 1,
      p_campaign_id: 10,
      p_token_hash: hashClaimCapability("secret"),
      p_action: "rename",
      p_name: "דוד",
    });
    expect(await response.json()).toEqual({ ok: true });
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("RISK-ACCESS-002 rejects an expired database capability and clears its cookie", async () => {
    rpc.mockResolvedValue({ data: "forbidden", error: null });
    const response = await POST(
      request({ id: 1, action: "release" }, "expired"),
      context
    );
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "forbidden" });
    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("claim-edit-e2e-1=;");
    expect(cookie).toContain("Max-Age=0");
  });

  it("RISK-ACCESS-005 releases through the atomic RPC and clears its cookie", async () => {
    rpc.mockResolvedValue({ data: "ok", error: null });
    const response = await POST(
      request({ id: 1, action: "release", name: "must be ignored" }, "secret"),
      context
    );
    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith(
      "edit_claim_with_capability",
      expect.objectContaining({ p_action: "release", p_name: null })
    );
    expect(await response.json()).toEqual({ ok: true });
    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("claim-edit-e2e-1=;");
    expect(cookie).toContain("Max-Age=0");
  });

  it("returns campaign, configuration, RPC, and invalid-result failures explicitly", async () => {
    campaignId.mockResolvedValueOnce(null);
    const missingCampaign = await POST(
      request({ id: 1, action: "release" }, "secret"),
      context
    );
    expect(missingCampaign.status).toBe(404);
    expect(await missingCampaign.json()).toEqual({ error: "campaign_not_found" });

    serviceClient.mockImplementationOnce(() => {
      throw new Error("missing configuration");
    });
    const configError = await POST(
      request({ id: 1, action: "release" }, "secret"),
      context
    );
    expect(configError.status).toBe(500);
    expect(await configError.json()).toEqual({ error: "missing configuration" });

    serviceClient.mockImplementationOnce(() => {
      throw "raw configuration error";
    });
    const rawConfigError = await POST(
      request({ id: 1, action: "release" }, "secret"),
      context
    );
    expect(rawConfigError.status).toBe(500);
    expect(await rawConfigError.json()).toEqual({ error: "unknown_error" });

    rpc.mockResolvedValueOnce({ data: null, error: new Error("rpc failed") });
    const rpcError = await POST(
      request({ id: 1, action: "release" }, "secret"),
      context
    );
    expect(rpcError.status).toBe(500);
    expect(await rpcError.json()).toEqual({ error: "rpc failed" });

    rpc.mockResolvedValueOnce({ data: "invalid_input", error: null });
    const invalidResult = await POST(
      request({ id: 1, action: "release" }, "secret"),
      context
    );
    expect(invalidResult.status).toBe(400);
    expect(await invalidResult.json()).toEqual({ error: "invalid_input" });
  });
});
