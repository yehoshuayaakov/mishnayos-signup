import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/campaigns/[slug]/state/route";
import { findCampaignId } from "@/lib/campaign";
import { hashClaimCapability } from "@/lib/claim-capability";
import { getSupabase } from "@/lib/supabase";

vi.mock("@/lib/supabase", () => ({ getSupabase: vi.fn() }));
vi.mock("@/lib/campaign", () => ({ findCampaignId: vi.fn() }));

const campaignId = vi.mocked(findCampaignId);
const serviceClient = vi.mocked(getSupabase);
const context = { params: Promise.resolve({ slug: "e2e" }) };

function clientWithRows(rows: unknown[]) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};
  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.order = vi.fn().mockResolvedValue({ data: rows, error: null });
  serviceClient.mockReturnValue({ from: vi.fn(() => builder) } as never);
}

describe("GET /api/campaigns/[slug]/state", () => {
  beforeEach(() => {
    campaignId.mockReset();
    serviceClient.mockReset();
    campaignId.mockResolvedValue(1);
  });

  it("AC-ACCESS-002 exposes edit state only for the matching unexpired browser capability", async () => {
    clientWithRows([
      {
        id: 1,
        seder: "זרעים",
        name: "ברכות",
        chapters: 9,
        claimed_by: "דוד",
        claimed_at: new Date(Date.now() - 60_000).toISOString(),
        claim_edit_token_hash: hashClaimCapability("mine"),
      },
      {
        id: 2,
        seder: "זרעים",
        name: "פאה",
        chapters: 8,
        claimed_by: "שרה",
        claimed_at: new Date(Date.now() - 60_000).toISOString(),
        claim_edit_token_hash: hashClaimCapability("theirs"),
      },
    ]);

    const response = await GET(
      new NextRequest("http://localhost/api/campaigns/e2e/state", {
        headers: { Cookie: "claim-edit-e2e-1=mine" },
      }),
      context
    );
    const body = await response.json();
    expect(body.tractates[0]).toMatchObject({ can_edit: true });
    expect(body.tractates[0].edit_until).toEqual(expect.any(String));
    expect(body.tractates[1]).toMatchObject({ can_edit: false, edit_until: null });
    expect(JSON.stringify(body)).not.toContain("claim_edit_token_hash");
    expect(JSON.stringify(body)).not.toContain("claimed_at");
  });

  it("RISK-ACCESS-002 hides an expired capability even when the hash matches", async () => {
    clientWithRows([
      {
        id: 1,
        seder: "זרעים",
        name: "ברכות",
        chapters: 9,
        claimed_by: "דוד",
        claimed_at: new Date(Date.now() - 16 * 60_000).toISOString(),
        claim_edit_token_hash: hashClaimCapability("mine"),
      },
    ]);
    const response = await GET(
      new NextRequest("http://localhost/api/campaigns/e2e/state", {
        headers: { Cookie: "claim-edit-e2e-1=mine" },
      }),
      context
    );
    expect((await response.json()).tractates[0]).toMatchObject({
      can_edit: false,
      edit_until: null,
    });
  });
});
