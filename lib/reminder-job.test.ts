import { describe, expect, it } from "vitest";
import { duePeriodKey } from "@/lib/reminder-job";

const TZ = "Asia/Jerusalem";
const sunday = new Date("2026-08-30T10:00:00.000Z");
const friday = new Date("2026-08-28T10:00:00.000Z");

describe("duePeriodKey", () => {
  it("skips inactive campaigns", () => {
    expect(
      duePeriodKey({
        isActive: false,
        cadence: "daily",
        timezone: TZ,
        deadlineAt: null,
        now: sunday,
      })
    ).toEqual({ due: false, reason: "inactive" });
  });

  it("skips after deadline_at", () => {
    expect(
      duePeriodKey({
        isActive: true,
        cadence: "daily",
        timezone: TZ,
        deadlineAt: "2026-01-01T00:00:00.000Z",
        now: sunday,
      })
    ).toEqual({ due: false, reason: "past_deadline" });
  });

  it("sends daily with a date period key", () => {
    const result = duePeriodKey({
      isActive: true,
      cadence: "daily",
      timezone: TZ,
      deadlineAt: "2027-01-01T00:00:00.000Z",
      now: sunday,
    });
    expect(result).toEqual({ due: true, periodKey: "2026-08-30" });
  });

  it("skips weekly unless it is Sunday in the campaign timezone", () => {
    expect(
      duePeriodKey({
        isActive: true,
        cadence: "weekly",
        timezone: TZ,
        deadlineAt: null,
        now: friday,
      })
    ).toEqual({ due: false, reason: "not_sunday" });

    const sundayResult = duePeriodKey({
      isActive: true,
      cadence: "weekly",
      timezone: TZ,
      deadlineAt: null,
      now: sunday,
    });
    expect(sundayResult.due).toBe(true);
  });

  it("sends week_before only inside the 7-day window", () => {
    const deadlineAt = "2026-09-06T21:00:00.000Z";
    expect(
      duePeriodKey({
        isActive: true,
        cadence: "week_before",
        timezone: TZ,
        deadlineAt,
        now: new Date("2026-08-20T10:00:00.000Z"),
      }).due
    ).toBe(false);

    expect(
      duePeriodKey({
        isActive: true,
        cadence: "week_before",
        timezone: TZ,
        deadlineAt,
        now: new Date("2026-08-31T10:00:00.000Z"),
      })
    ).toEqual({ due: true, periodKey: "week_before" });
  });
});
