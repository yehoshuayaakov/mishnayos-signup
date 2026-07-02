import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { findCampaignId } from "@/lib/campaign";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
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
      .select("id, seder, name, chapters, claimed_by")
      .eq("campaign_id", campaignId)
      .order("sort_order");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ tractates: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
