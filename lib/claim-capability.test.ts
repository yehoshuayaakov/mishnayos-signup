import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CLAIM_EDIT_WINDOW_SECONDS,
  claimCapabilityCookieName,
  claimCapabilityCookieOptions,
  hashClaimCapability,
  newClaimCapability,
} from "@/lib/claim-capability";

describe("claim capabilities", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });
  it("REQ-ACCESS-001 generates unique 256-bit URL-safe capabilities", () => {
    const first = newClaimCapability();
    const second = newClaimCapability();
    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(second).not.toBe(first);
  });

  it("RISK-ACCESS-001 hashes capabilities deterministically without storing the token", () => {
    expect(hashClaimCapability("secret-token")).toMatch(/^[0-9a-f]{64}$/);
    expect(hashClaimCapability("secret-token")).toBe(hashClaimCapability("secret-token"));
    expect(hashClaimCapability("other-token")).not.toBe(hashClaimCapability("secret-token"));
  });

  it("AC-ACCESS-001 creates scoped, short-lived HttpOnly cookie metadata", () => {
    expect(claimCapabilityCookieName("My Campaign!", 42)).toBe(
      "claim-edit-my-campaign--42"
    );
    expect(claimCapabilityCookieOptions()).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: CLAIM_EDIT_WINDOW_SECONDS,
    });
    expect(CLAIM_EDIT_WINDOW_SECONDS).toBe(900);
  });

  it("RISK-ACCESS-001 requires secure cookies in production only", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(claimCapabilityCookieOptions().secure).toBe(true);
    vi.stubEnv("NODE_ENV", "development");
    expect(claimCapabilityCookieOptions().secure).toBe(false);
  });
});
