import { describe, expect, it } from "vitest";
import { verifyBearerSecret } from "@/lib/admin";

describe("verifyBearerSecret", () => {
  it("requires a configured secret and Bearer prefix", () => {
    expect(verifyBearerSecret("Bearer abc", undefined)).toBe(false);
    expect(verifyBearerSecret(null, "abc")).toBe(false);
    expect(verifyBearerSecret("abc", "abc")).toBe(false);
    expect(verifyBearerSecret("Bearer abc", "abc")).toBe(true);
    expect(verifyBearerSecret("Bearer no", "abc")).toBe(false);
  });
});
