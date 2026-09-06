import { describe, expect, it } from "vitest";
import {
  claimFieldErrors,
  claimFormSchema,
  claimantNameSchema,
} from "@/lib/claim-validation";

describe("claim validation", () => {
  it("accepts any non-empty claimant name and trims it", () => {
    expect(claimantNameSchema.parse("  דוד Cohen  ")).toBe("דוד Cohen");
    expect(claimantNameSchema.safeParse("   ").success).toBe(false);
  });

  it("does not require an email when reminders are off", () => {
    expect(
      claimFormSchema.safeParse({
        name: "שרה",
        reminders: false,
        email: "",
        sendVoice: false,
        phone: "",
      }).success
    ).toBe(true);
  });

  it("shows required and invalid email errors when reminders are on", () => {
    const missing = claimFormSchema.safeParse({
      name: "שרה",
      reminders: true,
      email: "",
      sendVoice: false,
      phone: "",
    });
    expect(missing.success).toBe(false);
    if (!missing.success) {
      expect(claimFieldErrors(missing.error).email).toBe("נא למלא כתובת אימייל.");
    }

    const invalid = claimFormSchema.safeParse({
      name: "שרה",
      reminders: true,
      email: "not-an-email",
      sendVoice: false,
      phone: "",
    });
    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      expect(claimFieldErrors(invalid.error).email).toBe("כתובת האימייל אינה תקינה.");
    }
  });
});
