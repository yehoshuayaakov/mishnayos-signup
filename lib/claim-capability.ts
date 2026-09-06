import { createHash, randomBytes } from "node:crypto";

export const CLAIM_EDIT_WINDOW_SECONDS = 15 * 60;

export function newClaimCapability() {
  return randomBytes(32).toString("base64url");
}

export function hashClaimCapability(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function claimCapabilityCookieName(slug: string, tractateId: number) {
  const safeSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return `claim-edit-${safeSlug}-${tractateId}`;
}

export function claimCapabilityCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: CLAIM_EDIT_WINDOW_SECONDS,
  };
}
