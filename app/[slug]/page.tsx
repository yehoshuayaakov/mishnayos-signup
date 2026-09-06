import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCampaign } from "@/lib/campaign";
import { isEmailRemindersEnabled } from "@/lib/email-reminder-availability";
import { isReservedSlug } from "@/lib/reserved";
import { isVoiceRemindersEnabled } from "@/lib/voice";
import CampaignClient from "./CampaignClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await getCampaign(slug);
  if (!campaign) return { title: "חלוקת משניות" };
  return { title: campaign.title, description: campaign.in_memory_of };
}

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (isReservedSlug(slug)) notFound();

  const campaign = await getCampaign(slug);
  if (!campaign) notFound();

  return (
    <CampaignClient
      campaign={campaign}
      remindersAvailable={isEmailRemindersEnabled()}
      voiceAvailable={isVoiceRemindersEnabled()}
    />
  );
}
