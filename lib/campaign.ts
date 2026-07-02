import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

export type Campaign = {
  id: number;
  slug: string;
  title: string;
  in_memory_of: string;
  subtitle: string;
  instructions: string;
  photo_url: string;
  is_active: boolean;
};

const CAMPAIGN_COLUMNS =
  "id, slug, title, in_memory_of, subtitle, instructions, photo_url, is_active";

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
  if (error || !data) return null;
  return data as Campaign;
}
