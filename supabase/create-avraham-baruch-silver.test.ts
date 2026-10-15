import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  new URL("./create-avraham-baruch-silver.sql", import.meta.url),
  "utf8"
);
const normalized = sql.toLowerCase();

describe("Avraham Baruch Silver campaign SQL", () => {
  it("stores the approved public content with English instructions and no photo or deadline", () => {
    expect(sql).toContain("'avraham-baruch-silver'");
    expect(sql).toContain("'חלוקת משניות'");
    expect(sql).toContain("'לעל\"נ אברהם ברוך בן יוסף שלמה סילבר ז\"ל'");
    expect(sql).toContain("'נלב\"ע הושענא רבה כ\"א תשרי תשפ\"ז'");
    expect(sql).toContain(
      "'Click an available tractate to take it upon yourself.'"
    );
    expect(sql).toContain("'forest'");
    expect(sql).toContain("null");
    expect(sql).not.toContain("deadline_at =");
  });

  it("uses the operator creation function without Auth membership writes", () => {
    expect(normalized).toContain("perform public.create_campaign(");
    expect(normalized).not.toContain("campaign_memberships");
    expect(normalized).not.toMatch(/\bauth\./);
  });

  it("is idempotent and contains no destructive database operation", () => {
    expect(normalized).toMatch(
      /if not exists\s*\([\s\S]*where slug = 'avraham-baruch-silver'[\s\S]*then[\s\S]*perform public\.create_campaign/
    );
    expect(normalized).not.toMatch(/\b(drop|truncate|delete)\b/);
    expect(normalized).toContain("count(t.id) as tractate_count");
    expect(normalized).toContain("set theme = 'forest'");
  });
});
