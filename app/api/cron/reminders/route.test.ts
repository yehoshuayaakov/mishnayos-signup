import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/cron/reminders/route";
import { runReminderJob } from "@/lib/reminder-job";

vi.mock("@/lib/reminder-job", () => ({
  runReminderJob: vi.fn(),
}));
vi.mock("@/lib/supabase", () => ({
  getSupabase: vi.fn(() => ({})),
}));

const job = vi.mocked(runReminderJob);

describe("GET /api/cron/reminders", () => {
  beforeEach(() => {
    job.mockReset();
    process.env.CRON_SECRET = "cron-secret";
  });

  it("returns 401 without the cron bearer token", async () => {
    const res = await GET(new Request("http://localhost/api/cron/reminders"));
    expect(res.status).toBe(401);
    expect(job).not.toHaveBeenCalled();
  });

  it("runs the job when authorized", async () => {
    job.mockResolvedValue({ emailed: 1, called: 0, skipped: 0, failed: 0 });
    const res = await GET(
      new Request("http://localhost/api/cron/reminders", {
        headers: { authorization: "Bearer cron-secret" },
      })
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, emailed: 1, called: 0, skipped: 0, failed: 0 });
  });
});
