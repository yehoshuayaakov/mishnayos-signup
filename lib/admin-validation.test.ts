import { describe, expect, it } from "vitest";
import {
  adminCampaignSchema,
  adminTractateSchema,
  organizerLoginSchema,
} from "@/lib/admin-validation";

const validCampaign = {
  title: "חלוקת משניות",
  in_memory_of: "פלוני בן פלוני",
  subtitle: "",
  instructions: "בחרו מסכת",
  photo_url: "https://example.com/photo.jpg",
  theme: "navy",
  deadline: "עד ראש חודש",
};

describe("admin validation", () => {
  it("RISK-ACCESS-008 accepts only HTTPS or internal campaign image URLs", () => {
    expect(adminCampaignSchema.safeParse(validCampaign).success).toBe(true);
    expect(
      adminCampaignSchema.safeParse({ ...validCampaign, photo_url: "" }).success
    ).toBe(true);
    expect(
      adminCampaignSchema.safeParse({ ...validCampaign, photo_url: "/photo.jpg" }).success
    ).toBe(true);
    expect(
      adminCampaignSchema.safeParse({ ...validCampaign, photo_url: "http://tracker.test/a" })
        .success
    ).toBe(false);
    expect(
      adminCampaignSchema.safeParse({ ...validCampaign, photo_url: "xhttps://tracker.test/a" })
        .success
    ).toBe(false);
    const issue = adminCampaignSchema.safeParse({
      ...validCampaign,
      photo_url: "ftp://tracker.test/a",
    });
    expect(issue.success).toBe(false);
    if (!issue.success) {
      expect(issue.error.issues[0]?.message).toBe("photo_url_must_be_https");
    }
  });

  it("AC-ACCESS-007 rejects unknown themes and blank required content", () => {
    expect(
      adminCampaignSchema.safeParse({ ...validCampaign, theme: "pink" }).success
    ).toBe(false);
    expect(
      adminCampaignSchema.safeParse({ ...validCampaign, title: " " }).success
    ).toBe(false);
    expect(
      adminCampaignSchema.safeParse({
        ...validCampaign,
        subtitle: "x".repeat(181),
      }).success
    ).toBe(false);
    const trimmed = adminCampaignSchema.parse({
      ...validCampaign,
      in_memory_of: "  פלוני  ",
      subtitle: "  משנה  ",
      instructions: "  בחרו מסכת  ",
      photo_url: "  https://example.com/photo.jpg  ",
      deadline: "  עד ראש חודש  ",
    });
    expect(trimmed.in_memory_of).toBe("פלוני");
    expect(trimmed.subtitle).toBe("משנה");
    expect(trimmed.instructions).toBe("בחרו מסכת");
    expect(trimmed.photo_url).toBe("https://example.com/photo.jpg");
    expect(trimmed.deadline).toBe("עד ראש חודש");
  });

  it("AC-ACCESS-008 validates rename names and permits release without one", () => {
    expect(adminTractateSchema.safeParse({ action: "rename", name: " דוד " }).success).toBe(
      true
    );
    expect(adminTractateSchema.safeParse({ action: "rename", name: " " }).success).toBe(
      false
    );
    expect(adminTractateSchema.safeParse({ action: "release" }).success).toBe(true);
  });

  it("RISK-ACCESS-004 requires a valid organizer email", () => {
    expect(organizerLoginSchema.parse({ email: " admin@example.com " }).email).toBe(
      "admin@example.com"
    );
    expect(organizerLoginSchema.safeParse({ email: "admin" }).success).toBe(false);
  });
});
