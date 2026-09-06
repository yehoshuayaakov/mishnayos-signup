import { describe, expect, it } from "vitest";
import { newManageToken } from "@/lib/reminder-token";

describe("newManageToken", () => {
  it("returns 64 hex chars (256-bit)", () => {
    const token = newManageToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is unique across calls", () => {
    expect(newManageToken()).not.toBe(newManageToken());
  });
});
