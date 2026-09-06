import { notFound } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { e2eManageProps } from "@/lib/e2e-fixture";
import ManageClient from "./ManageClient";

export const dynamic = "force-dynamic";

export default async function ReminderManagePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!token || token.length < 32) notFound();

  const fixture = e2eManageProps(token);
  if (fixture) return <ManageClient {...fixture} />;

  let supabase;
  try {
    supabase = getSupabase();
  } catch {
    notFound();
  }

  const { data: reminder } = await supabase
    .from("reminders")
    .select(
      "id, cadence, send_email, send_voice, locale, unsubscribed_at, tractate_id, campaign_id"
    )
    .eq("manage_token", token)
    .maybeSingle();

  if (!reminder) notFound();

  const { data: tractate } = await supabase
    .from("tractates")
    .select("name, name_en")
    .eq("id", reminder.tractate_id)
    .maybeSingle();
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("in_memory_of, title")
    .eq("id", reminder.campaign_id)
    .maybeSingle();

  if (!tractate || !campaign) notFound();

  const locale = reminder.locale === "en" ? "en" : "he";
  const tractateName = locale === "en" && tractate.name_en ? tractate.name_en : tractate.name;

  return (
    <ManageClient
      token={token}
      locale={locale}
      tractateName={tractateName}
      niftar={campaign.in_memory_of}
      cadence={reminder.cadence}
      sendEmail={reminder.send_email}
      sendVoice={reminder.send_voice}
      unsubscribed={Boolean(reminder.unsubscribed_at)}
    />
  );
}
