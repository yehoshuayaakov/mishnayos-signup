import type { User } from "@supabase/supabase-js";
import { createAuthServerClient } from "@/lib/supabase-auth";
import { getSupabase } from "@/lib/supabase";
import { e2eEnabled } from "@/lib/e2e-fixture";

export class OrganizerAuthError extends Error {
  constructor(
    public readonly status: 401 | 403,
    message: "unauthenticated" | "forbidden"
  ) {
    super(message);
    this.name = "OrganizerAuthError";
  }
}

export function organizerAuthStatus(error: unknown): 401 | 403 | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    (error.message === "unauthenticated" || error.message === "forbidden") &&
    "status" in error &&
    (error.status === 401 || error.status === 403)
  ) {
    return error.status;
  }
  return null;
}

export async function getOrganizerUser(): Promise<User | null> {
  if (e2eEnabled()) {
    return { id: "e2e-organizer", email: "organizer@example.com" } as User;
  }
  try {
    const auth = await createAuthServerClient();
    const {
      data: { user },
      error,
    } = await auth.auth.getUser();
    return error ? null : user;
  } catch {
    return null;
  }
}

export async function requireCampaignMembership(campaignId: number) {
  const user = await getOrganizerUser();
  if (!user) throw new OrganizerAuthError(401, "unauthenticated");

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("campaign_memberships")
    .select("campaign_id, role")
    .eq("user_id", user.id)
    .eq("campaign_id", campaignId)
    .maybeSingle();

  if (error || !data) throw new OrganizerAuthError(403, "forbidden");
  return { user, membership: data, supabase };
}
