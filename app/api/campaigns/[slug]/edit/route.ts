import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { findCampaignId } from "@/lib/campaign";

type EditAction = "rename" | "release";

export async function POST(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;

  let body: { id?: unknown; action?: unknown; name?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const id = body.id;
  const action = body.action as EditAction;
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!Number.isInteger(id) || (action !== "rename" && action !== "release")) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  if (action === "rename" && (name.length === 0 || name.length > 60)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabase();
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const campaignId = await findCampaignId(supabase, slug);
  if (campaignId === null) {
    return NextResponse.json({ error: "campaign_not_found" }, { status: 404 });
  }

  if (action === "release") {
    const { data, error } = await supabase
      .from("tractates")
      .update({ claimed_by: null, claimed_at: null })
      .eq("id", id as number)
      .eq("campaign_id", campaignId)
      .not("claimed_by", "is", null)
      .select("id");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data?.length) return NextResponse.json({ error: "not_claimed" }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  const { data, error } = await supabase
    .from("tractates")
    .update({ claimed_by: name, claimed_at: new Date().toISOString() })
    .eq("id", id as number)
    .eq("campaign_id", campaignId)
    .not("claimed_by", "is", null)
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data?.length) return NextResponse.json({ error: "not_claimed" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
