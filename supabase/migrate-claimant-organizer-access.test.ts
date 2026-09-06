import { beforeAll, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";

let migration = "";

beforeAll(async () => {
  migration = await readFile(
    new URL("./migrate-claimant-organizer-access.sql", import.meta.url),
    "utf8"
  );
});

describe("claimant/organizer migration contract", () => {
  it("RISK-ACCESS-001 stores only a claimant capability hash", () => {
    expect(migration).toContain("add column if not exists claim_edit_token_hash text");
    expect(migration).not.toMatch(/add column if not exists claim_edit_token\s/);
  });

  it("RISK-ACCESS-002 enforces the 15-minute window inside the edit RPC", () => {
    expect(migration).toContain("create or replace function public.claim_tractate");
    expect(migration).toContain("claimed_at >= now() - interval '15 minutes'");
    expect(migration).toContain("claim_edit_token_hash = p_token_hash");
  });

  it("RISK-ACCESS-005 deletes reminders and clears claims in one function", () => {
    const functionBody = migration.split(
      "create or replace function public.edit_claim_with_capability"
    )[1];
    expect(functionBody).toContain("delete from public.reminders");
    expect(functionBody).toContain("claimed_by = null");
    expect(functionBody).toContain("claim_edit_token_hash = null");
  });

  it("RISK-ACCESS-003 gives membership storage no anon or authenticated access", () => {
    expect(migration).toContain(
      "revoke all on table public.campaign_memberships from public, anon, authenticated"
    );
    expect(migration).toContain(
      "primary key (user_id, campaign_id)"
    );
  });
});
