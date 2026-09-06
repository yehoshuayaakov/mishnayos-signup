import { describe, expect, it } from "vitest";
import {
  dailyPeriodKey,
  inVoiceQuietHours,
  isSunday,
  weeklyPeriodKey,
  zonedParts,
} from "@/lib/time";

const TZ = "Asia/Jerusalem";

describe("zonedParts / period keys", () => {
  it("builds a daily key in the campaign timezone", () => {
    // 2026-08-30 10:00 UTC = 13:00 IDT, Sunday
    const parts = zonedParts(TZ, new Date("2026-08-30T10:00:00.000Z"));
    expect(parts.year).toBe(2026);
    expect(parts.month).toBe(8);
    expect(parts.day).toBe(30);
    expect(isSunday(parts)).toBe(true);
    expect(dailyPeriodKey(parts)).toBe("2026-08-30");
    expect(weeklyPeriodKey(parts)).toMatch(/^2026-W/);
  });

  it("does not treat Friday as Sunday", () => {
    const parts = zonedParts(TZ, new Date("2026-08-28T10:00:00.000Z"));
    expect(isSunday(parts)).toBe(false);
  });
});

describe("inVoiceQuietHours", () => {
  it("allows 09:00–20:59 local and blocks outside", () => {
    // 06:00 UTC = 09:00 IDT
    expect(inVoiceQuietHours(zonedParts(TZ, new Date("2026-08-30T06:00:00.000Z")))).toBe(true);
    // 17:59 UTC = 20:59 IDT
    expect(inVoiceQuietHours(zonedParts(TZ, new Date("2026-08-30T17:59:00.000Z")))).toBe(true);
    // 18:00 UTC = 21:00 IDT — exclusive end
    expect(inVoiceQuietHours(zonedParts(TZ, new Date("2026-08-30T18:00:00.000Z")))).toBe(false);
    // 05:00 UTC = 08:00 IDT
    expect(inVoiceQuietHours(zonedParts(TZ, new Date("2026-08-30T05:00:00.000Z")))).toBe(false);
  });
});
