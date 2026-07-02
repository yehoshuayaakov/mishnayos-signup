// One-off backup of the current `tractates` table before the multi-campaign refactor.
//
// Usage (from the project root):
//   1. Put SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
//   2. node scripts/backup-tractates.mjs
//
// Writes supabase/backups/<date>-tractates.sql (re-importable INSERTs) and
// supabase/backups/<date>-tractates.csv. Safe to re-run; files are timestamped.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

function loadEnvLocal() {
  const envPath = join(projectRoot, ".env.local");
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function sqlQuote(value) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number") return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
}

function csvCell(value) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function main() {
  loadEnvLocal();

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local first."
    );
    process.exit(1);
  }

  // Query PostgREST directly (Node's built-in fetch), so we don't load the
  // Supabase client's realtime/WebSocket layer (which breaks on Node < 22).
  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/tractates?select=*&order=sort_order.asc.nullsfirst`;
  const res = await fetch(endpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error(`Failed to read tractates (HTTP ${res.status}): ${detail}`);
    process.exit(1);
  }
  const rows = await res.json();

  const backupsDir = join(projectRoot, "supabase", "backups");
  mkdirSync(backupsDir, { recursive: true });

  const stamp = new Date().toISOString().slice(0, 10);
  const sqlPath = join(backupsDir, `${stamp}-tractates.sql`);
  const csvPath = join(backupsDir, `${stamp}-tractates.csv`);

  const columns =
    rows.length > 0
      ? Object.keys(rows[0])
      : ["id", "seder", "name", "chapters", "sort_order", "claimed_by", "claimed_at"];

  const sqlLines = [
    `-- Backup of the pre-refactor \`tractates\` table taken ${new Date().toISOString()}.`,
    `-- ${rows.length} row(s). Re-importable: paste into the Supabase SQL editor.`,
    "",
  ];
  for (const row of rows) {
    const cols = columns.join(", ");
    const vals = columns.map((c) => sqlQuote(row[c])).join(", ");
    sqlLines.push(`insert into tractates (${cols}) values (${vals});`);
  }
  writeFileSync(sqlPath, sqlLines.join("\n") + "\n", "utf8");

  const csvLines = [columns.join(",")];
  for (const row of rows) {
    csvLines.push(columns.map((c) => csvCell(row[c])).join(","));
  }
  writeFileSync(csvPath, csvLines.join("\n") + "\n", "utf8");

  console.log(`Backed up ${rows.length} row(s):`);
  console.log(`  ${sqlPath}`);
  console.log(`  ${csvPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
