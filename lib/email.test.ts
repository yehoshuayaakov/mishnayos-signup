import { describe, expect, it } from "vitest";
import { sendEmail } from "@/lib/email";

describe("sendEmail", () => {
  it("fails closed when Resend is not configured", async () => {
    const result = await sendEmail({
      to: "a@b.com",
      subject: "x",
      html: "x",
      text: "x",
    });
    expect(result).toEqual({ ok: false, retryable: false, error: "email_not_configured" });
  });
});
