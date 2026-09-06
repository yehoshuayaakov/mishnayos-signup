import { NextResponse } from "next/server";
import { adminCampaignSchema } from "@/lib/admin-validation";
import {
  organizerAuthStatus,
  requireCampaignMembership,
} from "@/lib/organizer-auth";

function campaignId(value: string) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const id = campaignId(params.id);
  if (id === null) {
    return NextResponse.json({ error: "invalid_campaign" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = adminCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", fields: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const { supabase } = await requireCampaignMembership(id);
    const { data, error } = await supabase
      .from("campaigns")
      .update(parsed.data)
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "campaign_not_found" }, { status: 404 });
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
