# Mishnayot Signup (חלוקת משניות)

A website where people sign up to learn tractates of Mishnah in memory of someone who passed away. Shows all 64 tractate slots grouped by Seder, who has taken each one, and lets visitors claim an open tractate by entering their name — no login required.

One deployment can host **many campaigns** (one per niftar/nifteres), each at its own URL like `/nemirof`. Adding another person is a single SQL call — no new project or redeploy.

Built with Next.js (App Router) + Supabase (free Postgres database), designed to deploy on Vercel's free tier.

## How it is organized

- `campaigns` table: one row per person being learned for (name, subtitle, instructions, photo URL, slug).
- `tractates` table: 64 rows per campaign, each linked by `campaign_id`.
- Each campaign is shown at `/<slug>` (e.g. `/nemirof`). The root `/` redirects to the `DEFAULT_CAMPAIGN` slug.

## 1. Set up the database (Supabase, ~5 minutes)

1. Go to [supabase.com](https://supabase.com), sign in (GitHub login works), and create a new project. Any region; choose a strong database password (you won't need it day-to-day).
2. In the project dashboard, open **SQL Editor → New query**, paste the entire contents of `supabase/schema.sql`, and click **Run**. This creates the `campaigns` and `tractates` tables, the `create_campaign(...)` function, and seeds the first campaign (`nemirof`).
   - Note: `schema.sql` **drops and recreates** the tables. If you already have data, back it up first (see "Backups" below).
3. Open **Project Settings → API** and copy two values:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **service_role key** (under "Project API keys" — keep this secret)

## 2. Run locally

```bash
# in the project folder
copy .env.local.example .env.local
# edit .env.local: Supabase URL, service_role key, admin password, DEFAULT_CAMPAIGN
npm install
npm run dev
```

Open http://localhost:3000 (it redirects to `/<DEFAULT_CAMPAIGN>`).

## 3. Deploy to Vercel

1. Push this folder to a GitHub repository.
2. Go to [vercel.com/new](https://vercel.com/new), sign in with GitHub, and import the repository. Vercel auto-detects Next.js — no settings to change.
3. Before clicking Deploy, expand **Environment Variables** and add:
   - `SUPABASE_URL` = your project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = your service_role key
   - `ADMIN_PASSWORD` = a password organizers use to edit or release signups
   - `DEFAULT_CAMPAIGN` = the slug the root URL should redirect to (e.g. `nemirof`)
4. Click **Deploy**. Share the campaign URL, e.g. `https://your-app.vercel.app/nemirof`.

## Adding a new campaign (another person)

No new project, no redeploy. In Supabase → **SQL Editor**, run:

```sql
select create_campaign(
  'name-slug',                 -- becomes the URL: /name-slug (lowercase, hyphens)
  'חלוקת משניות',              -- browser tab title
  'שם הנפטר',                  -- main heading (in memory of)
  'נלב"ע ...',                 -- subtitle (date of passing); '' to hide
  'לחצו על מסכת פנויה כדי לקבל אותה על עצמכם', -- instructions
  ''                           -- photo URL; '' shows a memorial candle
);
```

Then share `/name-slug`. Avoid reserved slugs (`api`, `admin`, etc. — see `lib/reserved.ts`).

### Photos

Set the sixth argument to an image URL. It can be a file in `public/` (e.g. `/niftar.jpg`) or any external URL. If it is empty or fails to load, the page shows a memorial candle (`public/candle.png`).

## Managing signups (fixing typos, removing names)

On the live site, each claimed tractate has an **עריכה** (Edit) button. Click it, enter the admin password, then either:
- **שמירה** — fix the name
- **שחרור** — release the tractate so someone else can take it

The password is set via the `ADMIN_PASSWORD` environment variable and applies to all campaigns for now. Share it only with family/organizers. After entering it once, your browser remembers it for the session.

You can also edit directly in Supabase → **Table Editor** → `tractates`.

## Backups

Snapshots of the `tractates` table live in `supabase/backups/`. To capture one:

```bash
node scripts/backup-tractates.mjs   # needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
```

This writes a re-importable `.sql` and a `.csv`. A manual Supabase dashboard export works too — see `supabase/backups/README.md`.

## Notes

- Claiming is race-safe: if two people grab the same tractate at the same moment, only the first succeeds and the second gets a polite message.
- Every database query is scoped by `campaign_id`, so campaigns never affect each other.
- The database is only accessible through the server API routes (the service key is never sent to browsers). Row Level Security is enabled with no policies, so public anon/authenticated keys get no access; the server's service_role key bypasses RLS.
