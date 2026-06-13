# Mishnayot Signup (חלוקת משניות)

A small website where people sign up to learn tractates of Mishnah in memory of someone who passed away. Shows all 64 tractate slots grouped by Seder, who has taken each one, and lets visitors claim an open tractate by entering their name — no login required.

Built with Next.js (App Router) + Supabase (free Postgres database), designed to deploy on Vercel's free tier.

## 1. Personalize

- Edit `lib/config.ts` — the name of the niftar/nifteres, subtitle, and instruction text.
- Add a photo: put a file named `niftar.jpg` in the `public/` folder. If there is no photo the page simply omits it.

## 2. Set up the database (Supabase, ~5 minutes)

1. Go to [supabase.com](https://supabase.com), sign in (GitHub login works), and create a new project. Any region; choose a strong database password (you won't need it day-to-day).
2. In the project dashboard, open **SQL Editor → New query**, paste the entire contents of `supabase/schema.sql`, and click **Run**. This creates and seeds the table with all 64 tractate slots.
3. Open **Project Settings → API** and copy two values:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **service_role key** (under "Project API keys" — keep this secret)

## 3. Run locally

```bash
# in the project folder
copy .env.local.example .env.local
# edit .env.local and paste in your Supabase URL and service_role key
npm install
npm run dev
```

Open http://localhost:3000.

## 4. Deploy to Vercel

1. Push this folder to a GitHub repository.
2. Go to [vercel.com/new](https://vercel.com/new), sign in with GitHub, and import the repository. Vercel auto-detects Next.js — no settings to change.
3. Before clicking Deploy, expand **Environment Variables** and add:
   - `SUPABASE_URL` = your project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = your service_role key
   - `ADMIN_PASSWORD` = a password organizers use to edit or release signups
4. Click **Deploy**. You'll get a public URL like `https://mishnayot-signup.vercel.app` to share.

To use a nicer URL, either rename the project in Vercel settings or add a custom domain (Vercel → Project → Settings → Domains).

## Managing signups (fixing typos, removing names)

On the live site, each claimed tractate has an **עריכה** (Edit) button. Click it, enter the admin password, then either:
- **שמירה** — fix the name
- **שחרור** — release the tractate so someone else can take it

The password is set via the `ADMIN_PASSWORD` environment variable in Vercel. Share it only with family/organizers. After entering it once, your browser remembers it for the session.

You can also edit directly in Supabase → **Table Editor** → `tractates`.

## Notes

- Claiming is race-safe: if two people grab the same tractate at the same moment, only the first succeeds and the second gets a polite message.
- The database is only accessible through the server API routes (the service key is never sent to browsers), and Row Level Security blocks direct public access.
