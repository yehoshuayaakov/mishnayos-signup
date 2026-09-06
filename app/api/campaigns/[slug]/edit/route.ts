import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { findCampaignId } from "@/lib/campaign";
import { claimantNameSchema } from "@/lib/claim-validation";
import {
  claimCapabilityCookieName,
  claimCapabilityCookieOptions,
  hashClaimCapability,
} from "@/lib/claim-capability";

type EditAction = "rename" | "release";

export async function POST(
  req: NextRequest,
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

  if (!Number.isInteger(id) || (action !== "rename" && action !== "release")) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const parsedName = claimantNameSchema.safeParse(body.name);
  if (action === "rename" && !parsedName.success) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }
  const name = action === "rename" && parsedName.success ? parsedName.data : null;
  const token = req.cookies.get(claimCapabilityCookieName(slug, id as number))?.value;
  if (!token) return NextResponse.json({ error: "forbidden" }, { status: 403 });

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

  const { data, error } = await supabase.rpc("edit_claim_with_capability", {
    p_tractate_id: id as number,
    p_campaign_id: campaignId,
    p_token_hash: hashClaimCapability(token),
    p_action: action,
    p_name: name,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (data === "forbidden") {
    const response = NextResponse.json({ error: "forbidden" }, { status: 403 });
    response.cookies.set(claimCapabilityCookieName(slug, id as number), "", {
      ...claimCapabilityCookieOptions(),
      maxAge: 0,
    });
    return response;
  }
  if (data !== "ok") {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const response = NextResponse.json({ ok: true });
  if (action === "release") {
    response.cookies.set(claimCapabilityCookieName(slug, id as number), "", {
      ...claimCapabilityCookieOptions(),
      maxAge: 0,
    });
  }
  return response;
}
