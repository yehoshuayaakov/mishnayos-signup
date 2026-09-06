import { z } from "zod";
import { claimantNameSchema } from "@/lib/claim-validation";
import { THEME_NAMES } from "@/lib/themes";

export const organizerLoginSchema = z.object({
  email: z.string().trim().email().max(120),
});

export const adminCampaignSchema = z.object({
  title: z.string().trim().min(1).max(120),
  in_memory_of: z.string().trim().min(1).max(180),
  subtitle: z.string().trim().max(180),
  instructions: z.string().trim().max(600),
  photo_url: z.string().trim().max(500).refine(
    (value) => value === "" || value.startsWith("/") || /^https:\/\//i.test(value),
    "photo_url_must_be_https"
  ),
  theme: z.enum(THEME_NAMES),
  deadline: z.string().trim().max(180),
});

export const adminTractateSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("rename"),
    name: claimantNameSchema,
  }),
  z.object({
    action: z.literal("release"),
  }),
]);

export type AdminCampaignInput = z.infer<typeof adminCampaignSchema>;
