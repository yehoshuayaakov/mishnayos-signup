export type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  weekday: string;
};

export function zonedParts(timeZone: string, date = new Date()): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    weekday: get("weekday"),
  };
}

export function dailyPeriodKey(parts: ZonedParts): string {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

/** ISO week key from a civil date (year-month-day in the campaign timezone). */
export function weeklyPeriodKey(parts: ZonedParts): string {
  const utc = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  const dayNum = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function isSunday(parts: ZonedParts): boolean {
  return parts.weekday === "Sun";
}

/** Voice quiet hours: 09:00 inclusive through 21:00 exclusive, campaign local time. */
export function inVoiceQuietHours(parts: ZonedParts): boolean {
  return parts.hour >= 9 && parts.hour < 21;
}
