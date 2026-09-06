import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/admin/login/route";
import { createAuthServerClient } from "@/lib/supabase-auth";

vi.mock("@/lib/supabase-auth", () => ({
  createAuthServerClient: vi.fn(),
}));

const authClient = vi.mocked(createAuthServerClient);
const signInWithOtp = vi.fn();

function request(body: unknown) {
  return new NextRequest("https://mishnayot.example/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/login", () => {
  beforeEach(() => {
    authClient.mockReset();
    signInWithOtp.mockReset();
    authClient.mockResolvedValue({ auth: { signInWithOtp } } as never);
  });

  it("AC-ACCESS-005 sends a magic link without creating unknown users", async () => {
    signInWithOtp.mockResolvedValue({ error: null });
    const response = await POST(request({ email: "admin@example.com" }));
    expect(response.status).toBe(200);
    expect(signInWithOtp).toHaveBeenCalledWith({
      email: "admin@example.com",
      options: {
        shouldCreateUser: false,
        emailRedirectTo: "https://mishnayot.example/auth/callback",
      },
    });
  });

  it("RISK-ACCESS-004 rejects invalid email before calling Supabase", async () => {
    const response = await POST(request({ email: "not-email" }));
    expect(response.status).toBe(400);
    expect(signInWithOtp).not.toHaveBeenCalled();
  });

  it("RISK-ACCESS-007 returns a generic provider failure", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    signInWithOtp.mockResolvedValue({ error: new Error("private provider detail") });
    const response = await POST(request({ email: "admin@example.com" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
