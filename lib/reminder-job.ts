import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { getAppUrl } from "@/lib/app-url";
import { isEmailRemindersEnabled } from "@/lib/email-reminder-availability";
import {
  confirmationCopy,
  reminderEmailCopy,
  tractateLabel,
} from "@/lib/reminder-copy";
import { newManageToken } from "@/lib/reminder-token";
import type { ReminderInput } from "@/lib/reminders";
import {
  dailyPeriodKey,
  inVoiceQuietHours,
  isSunday,
  weeklyPeriodKey,
  zonedParts,
} from "@/lib/time";
import { isVoiceRemindersEnabled, placeReminderCall } from "@/lib/voice";

const VOICE_CAP_PER_RUN = 20;
const WEEK_BEFORE_KEY = "week_before";

export { VOICE_CAP_PER_RUN };

export type DueResult =
  | { due: false; reason: "inactive" | "past_deadline" | "not_sunday" | "no_deadline" | "outside_week_before" }
  | { due: true; periodKey: string };

/** Whether this reminder should send on `now`, and the idempotency period key if so. */
export function duePeriodKey(opts: {
  isActive: boolean;
  cadence: "daily" | "weekly" | "week_before";
  timezone: string;
  deadlineAt: string | null;
  now?: Date;
}): DueResult {
  if (!opts.isActive) return { due: false, reason: "inactive" };
  const now = opts.now ?? new Date();
  const tz = opts.timezone || "Asia/Jerusalem";
  const parts = zonedParts(tz, now);
  const deadlineAt = opts.deadlineAt ? new Date(opts.deadlineAt) : null;
  if (deadlineAt && now > deadlineAt) return { due: false, reason: "past_deadline" };

  if (opts.cadence === "daily") {
    return { due: true, periodKey: dailyPeriodKey(parts) };
  }
  if (opts.cadence === "weekly") {
    if (!isSunday(parts)) return { due: false, reason: "not_sunday" };
    return { due: true, periodKey: weeklyPeriodKey(parts) };
  }
  if (!deadlineAt) return { due: false, reason: "no_deadline" };
  const windowStart = new Date(deadlineAt.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (now < windowStart || now > deadlineAt) return { due: false, reason: "outside_week_before" };
  return { due: true, periodKey: WEEK_BEFORE_KEY };
}

type DueRow = {
  id: number;
  email: string | null;
  phone_e164: string | null;
  cadence: "daily" | "weekly" | "week_before";
  send_email: boolean;
  send_voice: boolean;
  locale: "he" | "en";
  manage_token: string;
  tractates: {
    claimed_by: string;
    name: string;
    name_en: string;
  };
  campaigns: {
    in_memory_of: string;
    deadline: string;
    deadline_at: string | null;
    timezone: string;
    is_active: boolean;
  };
};

export async function claimWithOptionalReminder(
  supabase: SupabaseClient,
  opts: {
    tractateId: number;
    campaignId: number;
    name: string;
    reminder: ReminderInput | null;
    claimEditTokenHash: string;
  }
): Promise<{ status: "ok"; manageUrl?: string } | { status: "already_claimed" }> {
  const token = opts.reminder ? newManageToken() : "";
  const { data, error } = await supabase.rpc("claim_tractate", {
    p_tractate_id: opts.tractateId,
    p_campaign_id: opts.campaignId,
    p_name: opts.name,
    p_want_reminder: Boolean(opts.reminder),
    p_email: opts.reminder?.email ?? null,
    p_phone_e164: opts.reminder?.phoneE164 ?? null,
    p_cadence: opts.reminder?.cadence ?? null,
    p_send_email: opts.reminder?.sendEmail ?? false,
    p_send_voice: opts.reminder?.sendVoice ?? false,
    p_locale: opts.reminder?.locale ?? "he",
    p_manage_token: opts.reminder ? token : null,
    p_claim_edit_token_hash: opts.claimEditTokenHash,
  });
  if (error) throw error;
  if (data === "already_claimed") return { status: "already_claimed" };

  if (opts.reminder?.email) {
    sendClaimConfirmation(supabase, {
      tractateId: opts.tractateId,
      campaignId: opts.campaignId,
      name: opts.name,
      locale: opts.reminder.locale,
      email: opts.reminder.email,
      token,
    }).catch((err) => console.error("confirmation email failed", err));
  }

  if (!opts.reminder) return { status: "ok" };
  return { status: "ok", manageUrl: `${getAppUrl()}/reminders/${token}` };
}

async function sendClaimConfirmation(
  supabase: SupabaseClient,
  opts: {
    tractateId: number;
    campaignId: number;
    name: string;
    locale: ReminderInput["locale"];
    email: string;
    token: string;
  }
) {
  const { data: tractate } = await supabase
    .from("tractates")
    .select("name, name_en")
    .eq("id", opts.tractateId)
    .maybeSingle();
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("in_memory_of")
    .eq("id", opts.campaignId)
    .maybeSingle();
  if (!tractate || !campaign) return;

  const copy = confirmationCopy({
    locale: opts.locale,
    name: opts.name,
    tractate: tractateLabel(opts.locale, tractate.name, tractate.name_en),
    niftar: campaign.in_memory_of,
    manageUrl: `${getAppUrl()}/reminders/${opts.token}`,
  });
  await sendEmail({ to: opts.email, ...copy });
}

async function alreadySent(
  supabase: SupabaseClient,
  reminderId: number,
  channel: "email" | "voice",
  periodKey: string
): Promise<boolean> {
  const { data } = await supabase
    .from("reminder_sends")
    .select("id")
    .eq("reminder_id", reminderId)
    .eq("channel", channel)
    .eq("period_key", periodKey)
    .maybeSingle();
  return Boolean(data);
}

async function recordSend(
  supabase: SupabaseClient,
  reminderId: number,
  channel: "email" | "voice",
  periodKey: string,
  status: "sent" | "failed",
  providerId?: string
) {
  await supabase.from("reminder_sends").insert({
    reminder_id: reminderId,
    channel,
    period_key: periodKey,
    status,
    provider_id: providerId ?? null,
  });
}

export async function runReminderJob(supabase: SupabaseClient): Promise<{
  emailed: number;
  called: number;
  skipped: number;
  failed: number;
}> {
  const stats = { emailed: 0, called: 0, skipped: 0, failed: 0 };
  if (!isEmailRemindersEnabled()) return stats;

  const { data, error } = await supabase
    .from("reminders")
    .select(
      "id, email, phone_e164, cadence, send_email, send_voice, locale, manage_token, tractates!reminders_tractate_id_fkey(claimed_by, name, name_en), campaigns!reminders_campaign_id_fkey(in_memory_of, deadline, deadline_at, timezone, is_active)"
    )
    .is("unsubscribed_at", null);

  if (error) throw error;

  const rows = (data ?? []) as unknown as DueRow[];
  const now = new Date();
  let voiceThisRun = 0;

  for (const row of rows) {
    const due = duePeriodKey({
      isActive: Boolean(row.campaigns?.is_active),
      cadence: row.cadence,
      timezone: row.campaigns?.timezone || "Asia/Jerusalem",
      deadlineAt: row.campaigns?.deadline_at ?? null,
      now,
    });
    if (!due.due) {
      stats.skipped += 1;
      continue;
    }
    const periodKey = due.periodKey;

    const tractate = tractateLabel(row.locale, row.tractates.name, row.tractates.name_en);
    const name = row.tractates.claimed_by;
    const manageUrl = `${getAppUrl()}/reminders/${row.manage_token}`;

    if (row.send_email && row.email) {
      const already = await alreadySent(supabase, row.id, "email", periodKey);
      if (!already) {
        const copy = reminderEmailCopy({
          locale: row.locale,
          name,
          tractate,
          niftar: row.campaigns.in_memory_of,
          deadline: row.campaigns.deadline,
          manageUrl,
        });
        const result = await sendEmail({ to: row.email, ...copy });
        if (result.ok) {
          await recordSend(supabase, row.id, "email", periodKey, "sent", result.id);
          stats.emailed += 1;
        } else if (!result.retryable) {
          await recordSend(supabase, row.id, "email", periodKey, "failed");
          stats.failed += 1;
        } else {
          stats.failed += 1;
        }
      }
    }

    if (row.send_voice && row.phone_e164 && isVoiceRemindersEnabled()) {
      const parts = zonedParts(row.campaigns.timezone || "Asia/Jerusalem", now);
      if (!inVoiceQuietHours(parts) || voiceThisRun >= VOICE_CAP_PER_RUN) {
        stats.skipped += 1;
        continue;
      }
      const already = await alreadySent(supabase, row.id, "voice", periodKey);
      if (already) continue;
      const result = await placeReminderCall({ to: row.phone_e164, reminderId: row.id });
      if (result.ok) {
        await recordSend(supabase, row.id, "voice", periodKey, "sent", result.sid);
        voiceThisRun += 1;
        stats.called += 1;
      } else if (!result.retryable) {
        await recordSend(supabase, row.id, "voice", periodKey, "failed");
        stats.failed += 1;
      } else {
        stats.failed += 1;
      }
    }
  }

  return stats;
}
