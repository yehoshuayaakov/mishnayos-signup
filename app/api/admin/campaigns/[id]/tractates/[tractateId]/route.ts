import { NextResponse } from "next/server";
import { adminTractateSchema } from "@/lib/admin-validation";
import {
  organizerAuthStatus,
  requireCampaignMembership,
} from "@/lib/organizer-auth";

function positiveId(value: string) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; tractateId: string }> }
) {
  const params = await context.params;
  const campaignId = positiveId(params.id);
  const tractateId = positiveId(params.tractateId);
  if (campaignId === null || tractateId === null) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = adminTractateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  try {
    const { supabase } = await requireCampaignMembership(campaignId);
    if (parsed.data.action === "release") {
      const { data, error } = await supabase.rpc("release_tractate", {
        p_tractate_id: tractateId,
        p_campaign_id: campaignId,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (data === "not_claimed") {
        return NextResponse.json({ error: "not_claimed" }, { status: 404 });
      }
      return NextResponse.json({ ok: true });
    }

    const { data, error } = await supabase
      .from("tractates")
      .update({ claimed_by: parsed.data.name })
      .eq("id", tractateId)
      .eq("campaign_id", campaignId)
      .not("claimed_by", "is", null)
      .select("id")
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "not_claimed" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = organizerAuthStatus(error);
    if (status) {
      return NextResponse.json(
        { error: status === 401 ? "unauthenticated" : "forbidden" },
        { status }
      );
    }
    const message = error instanceof Error ? error.message : "unknown_error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
