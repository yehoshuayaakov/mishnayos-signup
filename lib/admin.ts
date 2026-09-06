import { timingSafeEqual } from "node:crypto";

function safeEqual(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

export function verifyBearerSecret(header: string | null, secret: string | undefined): boolean {
  if (!secret) return false;
  if (!header || !header.startsWith("Bearer ")) return false;
  return safeEqual(header.slice("Bearer ".length), secret);
}
