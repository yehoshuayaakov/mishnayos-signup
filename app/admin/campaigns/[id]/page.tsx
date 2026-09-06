import { notFound, redirect } from "next/navigation";
import { AdminCampaignEditor } from "@/components/admin/AdminCampaignEditor";
import { adminCampaignSchema } from "@/lib/admin-validation";
import {
  OrganizerAuthError,
  requireCampaignMembership,
} from "@/lib/organizer-auth";
import { e2eAdminCampaign } from "@/lib/e2e-fixture";

export default async function AdminCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const route = await params;
  const campaignId = Number(route.id);
  if (!Number.isSafeInteger(campaignId) || campaignId <= 0) notFound();
  const fixture = e2eAdminCampaign(campaignId);
  if (fixture) {
    return (
      <main dir="rtl" className="campaign-root min-h-screen bg-[#f5f7f9] px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <AdminCampaignEditor
            campaignId={campaignId}
            slug={fixture.slug}
            initialCampaign={fixture.campaign}
            initialTractates={fixture.tractates}
          />
        </div>
      </main>
    );
  }

  try {
    const { supabase } = await requireCampaignMembership(campaignId);
    const [{ data: campaign }, { data: tractates }] = await Promise.all([
      supabase
        .from("campaigns")
        .select("id, slug, title, in_memory_of, subtitle, instructions, photo_url, theme, deadline")
        .eq("id", campaignId)
        .maybeSingle(),
      supabase
        .from("tractates")
        .select("id, seder, name, chapters, claimed_by")
        .eq("campaign_id", campaignId)
        .order("sort_order"),
    ]);

    if (!campaign) notFound();
    const parsedCampaign = adminCampaignSchema.safeParse(campaign);
    if (!parsedCampaign.success) notFound();

    return (
      <main dir="rtl" className="campaign-root min-h-screen bg-[#f5f7f9] px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <AdminCampaignEditor
            campaignId={campaignId}
            slug={campaign.slug}
            initialCampaign={parsedCampaign.data}
            initialTractates={tractates ?? []}
          />
        </div>
      </main>
    );
  } catch (error) {
    if (error instanceof OrganizerAuthError && error.status === 401) {
      redirect("/admin/login");
    }
    if (error instanceof OrganizerAuthError) notFound();
    throw error;
  }
}
