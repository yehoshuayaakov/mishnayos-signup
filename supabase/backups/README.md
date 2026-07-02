# Backups

Snapshots of the `tractates` table, kept as a historical record (especially the data
that existed before the multi-campaign refactor).

## Automatic (script)

From the project root, with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set in
`.env.local`:

```bash
node scripts/backup-tractates.mjs
```

This writes two timestamped files here:

- `<date>-tractates.sql` — re-importable `INSERT` statements (paste into the Supabase SQL editor to restore).
- `<date>-tractates.csv` — the same rows as CSV for viewing in a spreadsheet.

## Manual (Supabase dashboard)

If you prefer not to use local credentials:

1. Supabase dashboard -> **Table Editor** -> `tractates`.
2. Use the **Export** button to download a CSV.
3. Save it in this folder as `<date>-tractates.csv` and note below what it contains.

## Snapshot log

- (add a line here each time you take a backup: date, why, filename)
