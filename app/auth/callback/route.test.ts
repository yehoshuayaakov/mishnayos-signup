import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/auth/callback/route";
import { createAuthServerClient } from "@/lib/supabase-auth";

vi.mock("@/lib/supabase-auth", () => ({
  createAuthServerClient: vi.fn(),
}));

const authClient = vi.mocked(createAuthServerClient);
const exchange = vi.fn();

describe("GET /auth/callback", () => {
  beforeEach(() => {
    authClient.mockReset();
    exchange.mockReset();
    authClient.mockResolvedValue({ auth: { exchangeCodeForSession: exchange } } as never);
  });

  it("AC-ACCESS-005 exchanges a valid code and redirects only within admin", async () => {
    exchange.mockResolvedValue({ error: null });
    const response = await GET(
      new NextRequest(
        "https://mishnayot.example/auth/callback?code=abc&next=/admin/campaigns/1"
      )
    );
    expect(exchange).toHaveBeenCalledWith("abc");
    expect(response.headers.get("location")).toBe(
      "https://mishnayot.example/admin/campaigns/1"
    );
  });

  it("RISK-ACCESS-007 rejects missing codes and external redirect targets", async () => {
    const response = await GET(
      new NextRequest(
        "https://mishnayot.example/auth/callback?next=https://evil.example"
      )
    );
    expect(exchange).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://mishnayot.example/admin/login?error=invalid_link"
    );
  });
});
