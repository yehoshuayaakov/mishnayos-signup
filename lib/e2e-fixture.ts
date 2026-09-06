import type { Campaign } from "@/lib/campaign";

/** Playwright-only campaign so SSR can render `/e2e` without Supabase. Never set E2E_FIXTURE on Vercel. */
export function e2eEnabled(): boolean {
  return process.env.E2E_FIXTURE === "1";
}

export const E2E_MANAGE_TOKEN = "e".repeat(64);

export function e2eCampaign(slug: string): Campaign | null {
  if (!e2eEnabled()) return null;
  return {
    id: 1,
    slug,
    title: "E2E",
    in_memory_of: "בדיקת מערכת",
    subtitle: "חלוקת בדיקה",
    deadline: "נא לסיים עד סוף הבדיקה",
    deadline_at: "2027-12-31T21:59:59.000Z",
    timezone: "Asia/Jerusalem",
    instructions: "לחצו על מסכת פנויה כדי לקבל אותה על עצמכם",
    photo_url: "/candle.png",
    theme: "navy",
    is_active: true,
  };
}

export function e2eAdminCampaign(id: number) {
  if (!e2eEnabled() || id !== 1) return null;
  const campaign = e2eCampaign("e2e");
  if (!campaign) return null;
  return {
    campaign: {
      title: campaign.title,
      in_memory_of: campaign.in_memory_of,
      subtitle: campaign.subtitle,
      instructions: campaign.instructions,
      photo_url: campaign.photo_url,
      theme: campaign.theme as "navy",
      deadline: campaign.deadline,
    },
    slug: campaign.slug,
    tractates: [
      {
        id: 1,
        seder: "זרעים",
        name: "ברכות",
        chapters: 9,
        claimed_by: "דוד",
      },
      {
        id: 2,
        seder: "זרעים",
        name: "פאה",
        chapters: 8,
        claimed_by: null,
      },
    ],
  };
}

export function e2eManageProps(token: string) {
  if (!e2eEnabled() || token !== E2E_MANAGE_TOKEN) return null;
  return {
    token,
    locale: "he" as const,
    tractateName: "ברכות",
    niftar: "בדיקת מערכת",
    cadence: "weekly",
    sendEmail: true,
    sendVoice: true,
    unsubscribed: false,
  };
}
