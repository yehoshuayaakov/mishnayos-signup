import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  OrganizerAuthError,
  getOrganizerUser,
  organizerAuthStatus,
  requireCampaignMembership,
} from "@/lib/organizer-auth";
import { createAuthServerClient } from "@/lib/supabase-auth";
import { getSupabase } from "@/lib/supabase";

vi.mock("@/lib/supabase-auth", () => ({
  createAuthServerClient: vi.fn(),
}));
vi.mock("@/lib/supabase", () => ({
  getSupabase: vi.fn(),
}));

const authClient = vi.mocked(createAuthServerClient);
const serviceClient = vi.mocked(getSupabase);

function authenticatedUser(user: { id: string; email: string } | null, error: Error | null = null) {
  authClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error }),
    },
  } as never);
}

function membershipResult(data: unknown, error: unknown = null) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};
  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.maybeSingle = vi.fn().mockResolvedValue({ data, error });
  const client = { from: vi.fn(() => builder) };
  serviceClient.mockReturnValue(client as never);
  return { client, builder };
}

describe("organizer authorization", () => {
  beforeEach(() => {
    authClient.mockReset();
    serviceClient.mockReset();
    vi.stubEnv("E2E_FIXTURE", "0");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("RISK-ACCESS-007 trusts a server-verified user only", async () => {
    authenticatedUser(null, new Error("invalid session"));
    await expect(getOrganizerUser()).resolves.toBeNull();
  });

  it("AC-ACCESS-006 returns 401 when no organizer is authenticated", async () => {
    authenticatedUser(null);
    await expect(requireCampaignMembership(12)).rejects.toMatchObject({
      status: 401,
      message: "unauthenticated",
    } satisfies Partial<OrganizerAuthError>);
    expect(serviceClient).not.toHaveBeenCalled();
  });

  it("RISK-ACCESS-003 returns 403 when campaign membership is absent", async () => {
    authenticatedUser({ id: "user-1", email: "admin@example.com" });
    membershipResult(null);
    await expect(requireCampaignMembership(12)).rejects.toMatchObject({
      status: 403,
      message: "forbidden",
    } satisfies Partial<OrganizerAuthError>);
  });

  it("AC-ACCESS-006 returns the scoped service client for a member", async () => {
    authenticatedUser({ id: "user-1", email: "admin@example.com" });
    const { client, builder } = membershipResult({
      campaign_id: 12,
      role: "organizer",
    });
    const result = await requireCampaignMembership(12);
    expect(result.supabase).toBe(client);
    expect(client.from).toHaveBeenCalledWith("campaign_memberships");
    expect(builder.select).toHaveBeenCalledWith("campaign_id, role");
    expect(builder.eq).toHaveBeenNthCalledWith(1, "user_id", "user-1");
    expect(builder.eq).toHaveBeenNthCalledWith(2, "campaign_id", 12);
  });

  it("maps only recognized organizer authorization errors to HTTP statuses", () => {
    const unauthenticated = new OrganizerAuthError(401, "unauthenticated");
    expect(unauthenticated.name).toBe("OrganizerAuthError");
    expect(organizerAuthStatus(unauthenticated)).toBe(401);
    expect(organizerAuthStatus(new OrganizerAuthError(403, "forbidden"))).toBe(403);
    expect(organizerAuthStatus({ status: 500, message: "forbidden" })).toBeNull();
    expect(organizerAuthStatus({ status: 403, message: "other" })).toBeNull();
    expect(organizerAuthStatus(null)).toBeNull();
    expect(organizerAuthStatus("forbidden")).toBeNull();
  });

  it("uses the isolated E2E organizer only when the fixture flag is explicit", async () => {
    vi.stubEnv("E2E_FIXTURE", "1");
    await expect(getOrganizerUser()).resolves.toMatchObject({
      id: "e2e-organizer",
      email: "organizer@example.com",
    });
    expect(authClient).not.toHaveBeenCalled();
  });

  it("fails closed when auth configuration throws", async () => {
    authClient.mockRejectedValue(new Error("missing config"));
    await expect(getOrganizerUser()).resolves.toBeNull();
  });
});
