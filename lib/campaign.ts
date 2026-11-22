import type { SupabaseClient } from "@supabase/supabase-js";
import { e2eCampaign } from "@/lib/e2e-fixture";
import { getSupabase } from "@/lib/supabase";

export type CampaignGender = "masculine" | "feminine";

export type Campaign = {
  id: number;
  slug: string;
  title: string;
  in_memory_of: string;
  subtitle: string;
  deadline: string;
  deadline_at: string | null;
  timezone: string;
  instructions: string;
  photo_url: string;
  theme: string;
  /** Grammatical gender of the person being memorialized. Missing means masculine. */
  gender?: CampaignGender;
  is_active: boolean;
};

const CAMPAIGN_COLUMNS_WITHOUT_GENDER =
  "id, slug, title, in_memory_of, subtitle, deadline, deadline_at, timezone, instructions, photo_url, theme, is_active";
const CAMPAIGN_COLUMNS =
  "id, slug, title, in_memory_of, subtitle, deadline, deadline_at, timezone, instructions, photo_url, theme, gender, is_active";

export function memorialFooter(gender: CampaignGender | null | undefined): string {
  return gender === "feminine"
    ? "תהא נשמתה צרורה בצרור החיים"
    : "תהא נשמתו צרורה בצרור החיים";
}

// Resolve a slug to a campaign id inside an API route. Returns null if the
// campaign does not exist or is inactive, so callers can reply 404.
export async function findCampaignId(
  supabase: SupabaseClient,
  slug: string
): Promise<number | null> {
  const { data, error } = await supabase
    .from("campaigns")
    .select("id")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !data) return null;
  return data.id as number;
}

// Load full campaign details for server components. Returns null on any failure
// (missing env, not found, inactive) so the page can render notFound().
export async function getCampaign(slug: string): Promise<Campaign | null> {
  const fixture = e2eCampaign(slug);
  if (fixture) return fixture;

  let supabase: SupabaseClient;
  try {
    supabase = getSupabase();
  } catch {
    return null;
  }
  const { data, error } = await supabase
    .from("campaigns")
    .select(CAMPAIGN_COLUMNS)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!error && data) return data as Campaign;
  // Boards stay up if this deploy arrives before migrate-campaign-gender.sql.
  const fallback = await supabase
    .from("campaigns")
    .select(CAMPAIGN_COLUMNS_WITHOUT_GENDER)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (fallback.error || !fallback.data) return null;
  return { ...fallback.data, gender: "masculine" };
}
