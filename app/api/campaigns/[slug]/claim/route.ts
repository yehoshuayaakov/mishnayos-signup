import { NextResponse } from "next/server";
import { claimantNameSchema } from "@/lib/claim-validation";
import { getSupabase } from "@/lib/supabase";
import { getCampaign } from "@/lib/campaign";
import { isEmailRemindersEnabled } from "@/lib/email-reminder-availability";
import { parseReminderFields } from "@/lib/reminders";
import { claimWithOptionalReminder } from "@/lib/reminder-job";
import { isVoiceRemindersEnabled } from "@/lib/voice";
import {
  claimCapabilityCookieName,
  claimCapabilityCookieOptions,
  hashClaimCapability,
  newClaimCapability,
} from "@/lib/claim-capability";

export async function POST(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const id = body.id;
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const parsedName = claimantNameSchema.safeParse(body.name);
  if (!parsedName.success) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }
  const name = parsedName.data;

  const campaign = await getCampaign(slug);
  if (!campaign) {
    return NextResponse.json({ error: "campaign_not_found" }, { status: 404 });
  }
  if (body.reminders === true && !isEmailRemindersEnabled()) {
    return NextResponse.json({ error: "reminders_unavailable" }, { status: 400 });
  }

  const parsed = parseReminderFields(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  if (parsed.reminder?.sendVoice && !isVoiceRemindersEnabled()) {
    return NextResponse.json({ error: "voice_unavailable" }, { status: 400 });
  }

  if (parsed.reminder?.cadence === "week_before" && !campaign.deadline_at) {
    return NextResponse.json({ error: "deadline_required" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabase();
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  try {
    const claimCapability = newClaimCapability();
    const result = await claimWithOptionalReminder(supabase, {
      tractateId: id as number,
      campaignId: campaign.id,
      name,
      reminder: parsed.reminder,
      claimEditTokenHash: hashClaimCapability(claimCapability),
    });
    if (result.status === "already_claimed") {
      return NextResponse.json({ error: "already_claimed" }, { status: 409 });
    }
    const response = NextResponse.json({
      ok: true,
      ...(result.manageUrl ? { manageUrl: result.manageUrl } : {}),
    });
    response.cookies.set(
      claimCapabilityCookieName(slug, id as number),
      claimCapability,
      claimCapabilityCookieOptions()
    );
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
