import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  new URL("./create-biala-ostrova-rebbe.sql", import.meta.url),
  "utf8"
);
const normalized = sql.toLowerCase();

describe("Biala Ostrova campaign SQL", () => {
  it("AC-BIALA-005 preserves the approved public content and asset", () => {
    expect(sql).toContain("'biala-ostrova-rebbe'");
    expect(sql).toContain("'חלוקת משניות'");
    expect(sql).toContain(
      "'כ\"ק האדמו\"ר מביאלא אוסטרובא רבי אברהם ירחמיאל בן הרה\"ק דוד מתתיהו זצ\"ל'"
    );
    expect(sql).toContain("'נלב\"ע ח\"י אלול תשפ\"ו'");
    expect(sql).toContain("'נא לסיים עד י\"ט תשרי תשפ\"ז'");
    expect(sql).toContain("'/biala-ostrova-rebbe.jpg'");
    expect(sql).toContain("'navy'");
  });

  it("RISK-BIALA-004 includes only the approved temporary support address", () => {
    expect(sql).toContain("yehoshuayaakov@gmail.com");
    expect(sql.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi)).toEqual([
      "yehoshuayaakov@gmail.com",
    ]);
  });

  it("RISK-BIALA-005 stores the Jerusalem end-of-day deadline explicitly", () => {
    expect(sql).toContain("'2026-09-30 23:59:59+03'");
    expect(sql).toContain("'Asia/Jerusalem'");
  });

  it("AC-BIALA-008 uses the operator creation function without Auth membership writes", () => {
    expect(normalized).toContain("perform public.create_campaign(");
    expect(normalized).not.toContain("campaign_memberships");
    expect(normalized).not.toMatch(/\bauth\./);
  });

  it("RISK-BIALA-007 is idempotent and contains no destructive database operation", () => {
    expect(normalized).toMatch(
      /if not exists\s*\([\s\S]*where slug = 'biala-ostrova-rebbe'[\s\S]*then[\s\S]*perform public\.create_campaign/
    );
    expect(normalized).not.toMatch(/\b(drop|truncate|delete)\b/);
    expect(normalized).toContain("count(t.id) as tractate_count");
  });
});
