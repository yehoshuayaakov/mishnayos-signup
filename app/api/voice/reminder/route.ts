import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { reminderTwiml, validateTwilioSignature } from "@/lib/voice";
import { tractateLabel, voiceScript } from "@/lib/reminder-copy";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!validateTwilioSignature(req)) {
    return xmlHangup();
  }

  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id)) {
    return xmlHangup();
  }

  try {
    const supabase = getSupabase();
    const { data: reminder } = await supabase
      .from("reminders")
      .select("id, locale, unsubscribed_at, tractate_id, campaign_id")
      .eq("id", id)
      .maybeSingle();

    if (!reminder || reminder.unsubscribed_at) {
      return xmlHangup();
    }

    const { data: tractate } = await supabase
      .from("tractates")
      .select("name, name_en")
      .eq("id", reminder.tractate_id)
      .maybeSingle();
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("in_memory_of")
      .eq("id", reminder.campaign_id)
      .maybeSingle();

    if (!tractate || !campaign) return xmlHangup();

    const locale = reminder.locale === "en" ? "en" : "he";
    const script = voiceScript({
      locale,
      tractate: tractateLabel(locale, tractate.name, tractate.name_en),
      niftar: campaign.in_memory_of,
    });
    return new NextResponse(reminderTwiml({ locale, script }), {
      headers: { "Content-Type": "text/xml" },
    });
  } catch {
    return xmlHangup();
  }
}

function xmlHangup() {
  return new NextResponse("<Response><Hangup/></Response>", {
    headers: { "Content-Type": "text/xml" },
  });
}
