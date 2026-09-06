import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { findCampaignId } from "@/lib/campaign";
import {
  CLAIM_EDIT_WINDOW_SECONDS,
  claimCapabilityCookieName,
  hashClaimCapability,
} from "@/lib/claim-capability";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  try {
    const supabase = getSupabase();
    const campaignId = await findCampaignId(supabase, slug);
    if (campaignId === null) {
      return NextResponse.json({ error: "campaign_not_found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("tractates")
      .select("id, seder, name, chapters, claimed_by, claimed_at, claim_edit_token_hash")
      .eq("campaign_id", campaignId)
      .order("sort_order");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const now = Date.now();
    const tractates = (data ?? []).map((tractate) => {
      const claimedAt = tractate.claimed_at ? new Date(tractate.claimed_at) : null;
      const editUntil = claimedAt
        ? new Date(claimedAt.getTime() + CLAIM_EDIT_WINDOW_SECONDS * 1000)
        : null;
      const token = req.cookies.get(claimCapabilityCookieName(slug, tractate.id))?.value;
      const canEdit = Boolean(
        token &&
          tractate.claim_edit_token_hash &&
          hashClaimCapability(token) === tractate.claim_edit_token_hash &&
          editUntil &&
          editUntil.getTime() > now
      );
      return {
        id: tractate.id,
        seder: tractate.seder,
        name: tractate.name,
        chapters: tractate.chapters,
        claimed_by: tractate.claimed_by,
        can_edit: canEdit,
        edit_until: canEdit ? editUntil?.toISOString() : null,
      };
    });
    return NextResponse.json({ tractates });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
