# Mishnayot Signup (חלוקת משניות)

A website where people sign up to learn tractates of Mishnah in memory of someone who passed away. Shows all 64 tractate slots grouped by Seder, who has taken each one, and lets visitors claim an open tractate by entering their name — no login required.

Email-reminder infrastructure exists but is hidden and disabled in the current release. Contact details are never shown on the public board.

One deployment can host **many campaigns** (one per niftar/nifteres), each at its own URL like `/nemirof`. Adding another person is a single SQL call — no new project or redeploy.

Built with Next.js (App Router) + Supabase (free Postgres database), designed to deploy on Vercel's free tier. Interactive controls are **React Aria Components**, styled with Tailwind to match the board.

### UI architecture

- `components/ds/` contains reusable RAC primitives (buttons, fields, switches, dialogs, banners, surfaces).
- `components/<feature>/` contains composite components with domain behavior, such as the claim dialog and reminder preferences.
- `app/` owns routing, data flow, and page composition; feature forms and reusable controls do not live in route files.
- UI work is **DS-first**: when a feature needs a control that does not exist, implement and review the primitive in `components/ds/` before composing the feature.

See `AGENTS.md` for the full development conventions.

## How it is organized

- `campaigns` table: one row per person being learned for (name, subtitle, instructions, photo URL, slug, display deadline, `deadline_at`, timezone).
- `tractates` table: 64 rows per campaign, each linked by `campaign_id`, with an optional hashed 15-minute claimant capability.
- `campaign_memberships` table: invited organizer access scoped to explicit campaigns.
- `reminders` table: optional contact + cadence for a claimed tractate (not exposed on the public state API).
- Each campaign is shown at `/<slug>` (e.g. `/nemirof`). The root `/` redirects to the `DEFAULT_CAMPAIGN` slug.

## 1. Set up the database (Supabase, ~5 minutes)

1. Go to [supabase.com](https://supabase.com), sign in (GitHub login works), and create a new project. Any region; choose a strong database password (you won't need it day-to-day).
2. In the project dashboard, open **SQL Editor → New query**, paste the entire contents of `supabase/schema.sql`, and click **Run**. This creates the tables, `create_campaign(...)`, `claim_tractate(...)`, and seeds the first campaign (`nemirof`).
   - Note: `schema.sql` **drops and recreates** the tables. If you already have data, back it up first (see "Backups" below).
   - If the project already has the multi-campaign schema, run `supabase/migrate-reminders.sql`, followed by `supabase/migrate-claimant-organizer-access.sql` (both additive). The reminder migration also backfills `deadline_at` for `nemirof` and `miller` to 30 July 2026 (ט"ז אב תשפ"ו).
3. Open **Project Settings → API** and copy three values:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **service_role key** (under "Project API keys" — keep this secret)
   - **anon/public key** (used for Supabase Auth session exchange; database access still stays server-side)

## 2. Run locally

```bash
# in the project folder
copy .env.local.example .env.local
# edit .env.local: Supabase URL, service_role key, anon key, DEFAULT_CAMPAIGN
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
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon/public key
   - `DEFAULT_CAMPAIGN` = the slug the root URL should redirect to (e.g. `nemirof`)
   - `APP_URL` = the public site URL (e.g. `https://your-app.vercel.app`)
   - `CRON_SECRET` = a long random string (Vercel Cron sends it as `Authorization: Bearer …`)
   - `ENABLE_EMAIL_REMINDERS=false` (keep this false until the reminder feature has a separate production launch)
   - Dormant email provider values: `RESEND_API_KEY`, `RESEND_FROM`
   - Keep `ENABLE_VOICE_REMINDERS=false`; time-sensitive channels are a later phase.
4. Click **Deploy**. Share the campaign URL, e.g. `https://your-app.vercel.app/nemirof`.

Vercel Cron hits `GET /api/cron/reminders` daily at 07:00 UTC. With `ENABLE_EMAIL_REMINDERS=false`, the job exits before reading reminder rows or contacting a provider.

## Adding a new campaign (another person)

No new project, no redeploy. In Supabase → **SQL Editor**, run:

```sql
select create_campaign(
  'name-slug',                 -- becomes the URL: /name-slug (lowercase, hyphens)
  'חלוקת משניות',              -- browser tab title
  'שם הנפטר',                  -- main heading (in memory of)
  'נלב"ע ...',                 -- subtitle (date of passing); '' to hide
  'לחצו על מסכת פנויה כדי לקבל אותה על עצמכם', -- instructions
  '',                          -- photo URL; '' shows a memorial candle
  'navy',                      -- theme: navy | forest | burgundy | slate
  'נא לסיים עד ...',            -- deadline line shown on the page; '' to hide
  '2026-07-30 23:59:59+03',    -- deadline_at (real timestamp for week-before reminders); null to skip
  'Asia/Jerusalem'             -- timezone for daily/weekly/quiet hours
);
```

Then share `/name-slug`. Avoid reserved slugs (`api`, `admin`, `reminders`, etc. — see `lib/reserved.ts`).

For the Biala Ostrova release, run `supabase/create-biala-ostrova-rebbe.sql` in the Supabase SQL Editor. It is idempotent: if that slug already exists, it reports the existing campaign without overwriting it. After verifying 64 tractates, set `DEFAULT_CAMPAIGN=biala-ostrova-rebbe` in Vercel.

To set or fix a deadline on an existing campaign:

```sql
update campaigns
set deadline = 'נא לסיים עד ט"ז אב תשפ"ו',
    deadline_at = '2026-07-30 23:59:59+03',
    timezone = 'Asia/Jerusalem'
where slug = 'name-slug';
```

`deadline` is the Hebrew line on the page. `deadline_at` is what the reminder job uses for “a week before.” Week-before reminders are skipped until `deadline_at` is set.

### Photos

Set the sixth argument to an image URL. It can be a file in `public/` (e.g. `/niftar.jpg`) or any external URL. If it is empty or fails to load, the page shows a memorial candle (`public/candle.png`).

## Managing signups and campaigns

The browser that claims a tractate sees **עריכה** for 15 minutes. It may fix the name or release the tractate without an account. The authorization token is HttpOnly, only its hash is stored, and the database enforces expiration. Other visitors never see that edit control.

Organizers use the separate `/admin` interface:

1. Invite the organizer in Supabase Auth (do not enable public signup).
2. Add membership:

```sql
insert into campaign_memberships (user_id, campaign_id)
values ('SUPABASE-AUTH-USER-UUID', CAMPAIGN_ID);
```

3. Add `https://your-site.example/auth/callback` to Supabase Auth redirect URLs and configure production SMTP.
4. The organizer requests a magic link at `/admin/login`, then can edit campaign text/photo URL/theme and rename or release tractates for assigned campaigns.

Releasing a tractate atomically deletes its reminder. Admin pages never select or show email, phone, or reminder tokens.

## Reminders (currently disabled)

The current release hides reminder controls, rejects crafted reminder enrollment, and makes the scheduled reminder job a no-op. Ordinary claims do not require an email and continue normally.

The dormant implementation can support the following after a separate verification and launch:

- **Cadence:** daily, weekly (Sunday in the campaign timezone), or one week before `deadline_at`
- **Channel:** email
- **Language:** Hebrew or English (the public page stays Hebrew)

They receive a confirmation with a manage/unsubscribe link (`/reminders/<token>`), and the claim success screen also shows that link. Recurring sends are logged in `reminder_sends` so the cron job is idempotent.

Voice code is retained behind `ENABLE_VOICE_REMINDERS`, but the channel is not ready for production exposure. Phone/SMS/WhatsApp require per-reminder local time and IANA timezone plus a frequent scheduler. That scheduling capability may later be offered optionally for email as well.

**Email provider:** [Resend](https://resend.com) via `lib/email.ts`. Enabling requires `ENABLE_EMAIL_REMINDERS=true`, `RESEND_API_KEY`, and a verified `RESEND_FROM`; any missing value fails closed. Do not enable the flag until the enabled reminder job’s production checks and monitoring are approved.

**Not in this version:** SMS, WhatsApp, and push notifications. For a later messaging channel, WhatsApp is the better cultural fit for this audience; SMS is the easier technical fallback. Add those as adapters next to `sendEmail` / `placeReminderCall`, not as a second reminder engine.

## Backups

Snapshots of the `tractates` table live in `supabase/backups/`. To capture one:

```bash
node scripts/backup-tractates.mjs   # needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
```

This writes a re-importable `.sql` and a `.csv`. A manual Supabase dashboard export works too — see `supabase/backups/README.md`.

## Notes

- Claiming is race-safe: if two people grab the same tractate at the same moment, only the first succeeds and the second gets a polite message.
- Public and organizer database queries are scoped by `campaign_id`; organizer access also requires an explicit membership.
- The database is only accessible through the server API routes (the service key is never sent to browsers). Row Level Security is enabled with no policies, so public anon/authenticated keys get no access; the server's service_role key bypasses RLS.

## Tests

```bash
npm test          # Vitest unit + mocked API tests (run on every PR)
npm run test:e2e  # Playwright smokes against a fixture campaign (`E2E_FIXTURE=1`)
npm run test:mutation -- --mutate "lib/example.ts" # targeted Stryker gate
npm run workflow:validate -- docs/features/<feature> # feature traceability
```

CI runs `npm test` and `npm run build` on every push/PR. Playwright runs on `main`, nightly, and `workflow_dispatch` (no live Resend/Twilio; the UI tests mock campaign APIs).

## Shipping reminders (checklist)

Do this on an existing production database — do **not** re-run `supabase/schema.sql` (it drops tables). Do **not** run `migrate-theme-deadline.sql` after `migrate-reminders.sql` (it would overwrite `create_campaign`).

1. `npm run build` succeeds locally.
2. In Supabase SQL Editor, run `supabase/migrate-reminders.sql`, then `supabase/migrate-claimant-organizer-access.sql`. Confirm the final `claim_tractate` exists and `deadline_at` / `timezone` are set on live campaigns.
3. Set Vercel env: `APP_URL`, `CRON_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `DEFAULT_CAMPAIGN`.
4. **Email (Resend, free at this scale):** create an account at [resend.com](https://resend.com), verify a domain you control, set `RESEND_API_KEY` and `RESEND_FROM` (e.g. `Mishnayos <reminders@yourdomain.com>`). Local tests can use Resend’s onboarding sender before the domain is verified. Without these vars, reminder emails are recorded as failed and not retried.
5. Keep `ENABLE_VOICE_REMINDERS=false`; Twilio credentials alone do not expose voice.
6. Deploy, then trigger `GET /api/cron/reminders` with `Authorization: Bearer $CRON_SECRET` and inspect `{ emailed, called, skipped, failed }` plus the `reminder_sends` table.
7. End-to-end: claim with email → confirmation + manage link on the page → unsubscribe; release a slot → reminder row gone.

## Later (not built)

- Organizer self-service: invitations/roles, campaign creation, binary photo upload, deadline/timezone editing, and account recovery. SQL `create_campaign` stays the fallback until then.
- Shared per-reminder local time + IANA timezone scheduling, required for phone/SMS/WhatsApp and optional for email.
- Paid product: organizers pay (Stripe Billing + Checkout + Customer Portal). Learners stay free. Cap Twilio/WhatsApp in the plan so usage cannot surprise-bill you.
- Stay on Vercel + Supabase. Kubernetes is not the next hosting step.
