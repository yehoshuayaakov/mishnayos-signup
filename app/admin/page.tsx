import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ds/Button";
import { Surface } from "@/components/ds/Surface";
import { getOrganizerUser } from "@/lib/organizer-auth";
import { getSupabase } from "@/lib/supabase";
import { e2eAdminCampaign } from "@/lib/e2e-fixture";

export default async function AdminPage() {
  const user = await getOrganizerUser();
  if (!user) redirect("/admin/login");

  let campaigns: Array<{
    id: number;
    slug: string;
    title: string;
    in_memory_of: string;
    is_active: boolean;
  }> = [];
  const fixture = e2eAdminCampaign(1);
  if (fixture) {
    campaigns = [
      {
        id: 1,
        slug: fixture.slug,
        title: fixture.campaign.title,
        in_memory_of: fixture.campaign.in_memory_of,
        is_active: true,
      },
    ];
  } else {
    const supabase = getSupabase();
    const { data: memberships } = await supabase
      .from("campaign_memberships")
      .select("campaign_id")
      .eq("user_id", user.id);
    const campaignIds = (memberships ?? []).map((membership) => membership.campaign_id);
    const { data } = campaignIds.length
      ? await supabase
          .from("campaigns")
          .select("id, slug, title, in_memory_of, is_active")
          .in("id", campaignIds)
          .order("created_at", { ascending: false })
      : { data: [] };
    campaigns = data ?? [];
  }

  return (
    <main dir="rtl" className="campaign-root min-h-screen bg-[#f5f7f9] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--navy-800)]">ניהול חלוקות</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">{user.email}</p>
          </div>
          <form action="/api/admin/logout" method="post">
            <Button type="submit" variant="ghost">
              יציאה
            </Button>
          </form>
        </header>

        {!campaigns.length ? (
          <Surface className="p-6 text-center text-[var(--muted)]">
            אין חלוקות המשויכות לחשבון זה. פנו למנהל המערכת.
          </Surface>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {campaigns.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/admin/campaigns/${campaign.id}`}
                className="rounded-2xl outline-none transition focus-visible:ring-3 focus-visible:ring-[rgb(46_89_132/0.18)]"
              >
                <Surface className="h-full p-5 transition hover:border-[var(--navy-600)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-bold text-[var(--navy-800)]">{campaign.title}</h2>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {campaign.in_memory_of}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#edf1f5] px-2.5 py-1 text-xs text-[var(--muted)]">
                      {campaign.is_active ? "פעילה" : "לא פעילה"}
                    </span>
                  </div>
                </Surface>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
