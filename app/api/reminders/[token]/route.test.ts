import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/reminders/[token]/route";
import { getSupabase } from "@/lib/supabase";

vi.mock("@/lib/supabase", () => ({
  getSupabase: vi.fn(),
}));

const supabase = vi.mocked(getSupabase);
const TOKEN = "a".repeat(64);

describe("POST /api/reminders/[token]", () => {
  beforeEach(() => {
    supabase.mockReset();
  });

  it("404s on a short token", async () => {
    const res = await POST(new Request("http://localhost/api/reminders/short"), {
      params: Promise.resolve({ token: "short" }),
    });
    expect(res.status).toBe(404);
  });

  it("unsubscribes by manage token", async () => {
    const select = vi.fn().mockResolvedValue({ data: [{ id: 1 }], error: null });
    const is = vi.fn().mockReturnValue({ select });
    const eq = vi.fn().mockReturnValue({ is });
    const update = vi.fn().mockReturnValue({ eq });
    supabase.mockReturnValue({ from: () => ({ update }) } as never);

    const res = await POST(new Request(`http://localhost/api/reminders/${TOKEN}`), {
      params: Promise.resolve({ token: TOKEN }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(eq).toHaveBeenCalledWith("manage_token", TOKEN);
  });
});
