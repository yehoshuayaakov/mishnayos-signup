# Agent notes — Mishnayot Signup

Hebrew-first multi-campaign Mishnah signup. Learners claim a tractate by name; they never log in. One Vercel + Supabase deploy hosts many campaigns (`/<slug>`). Root `/` redirects to `DEFAULT_CAMPAIGN`.

## Stack

- Next.js App Router, React, TypeScript
- Supabase Postgres; **service-role key on the server only** (API routes / server components)
- Vercel (Hobby cron is once a day). Do not introduce Kubernetes or extra microservices.

## Design system and SDLC

UI primitives are **React Aria Components (RAC)** with **Tailwind**, themed to the memorial board (navy/gold CSS variables on `.campaign-root`).

- `components/ds/`: reusable UI primitives only—Button, TextField, TextArea, Select, Switch, Checkbox, RadioGroup, Modal, Banner, Callout, Surface. One primitive per file.
- `components/<feature>/`: composite UI with behavior or domain meaning (for example `components/claim/ClaimDialog.tsx` and `ReminderPreferences.tsx`). Composites build exclusively from DS primitives.
- `app/`: routes, server data, and page-level composition. Do not define reusable controls or large feature forms in route files.
- **If a feature needs a control that is not in the DS yet, add the DS primitive first, then build the feature.** This is the first step of every UI change.
- Extract a composite when UI is reused, has its own state/behavior, or is substantial enough that isolation improves testing and readability.
- Claim / reminders / claimant warnings live in the claim composite and RAC modal, not inline in a tractate row.
- **RAC/Tailwind are implementation tools, not permission to redesign the app.** Preserve the established compact pill buttons, restrained spacing, 16px cards, navy/gold palette, typography, and visual hierarchy unless a redesign is explicitly requested.
- Keep Tailwind’s declared layer order in `app/globals.css`. Global resets belong in `@layer base`; never import full Tailwind Preflight or add unlayered resets that can override spacing utilities.
- Scroll long modal bodies inside `.ds-modal-scroll`; keep the header and primary actions reachable and do not place the browser scrollbar against the modal’s rounded outer edge.
- Forms use shared Zod schemas at both client and API boundaries. Show errors next to the relevant DS field, mark required fields in the UI, and never rely only on disabled submit buttons or browser-native validation.
- **Every UI change must be responsive and phone-friendly.** Design mobile-first, preserve at least 44px touch targets on phones, avoid horizontal overflow, keep modal actions reachable, and verify at 320px/375px plus desktop widths before considering the change complete.

Do not style raw `<input>` / `<button>` in feature code, add a one-off modal, or duplicate primitives under another folder.

## Feature delivery workflow

- Follow `docs/engineering/feature-workflow.md` for every feature.
- Store feature artifacts in `docs/features/<feature>/`: specification, implementation plan, implementation report, test map, test report, mutation report, and delivery summary.
- Use stable `REQ-*`, `AC-*`, and `RISK-*` identifiers through every handoff.
- Do not implement before the specification and plan are approved. Do not finish before behavior mapping, deterministic tests, targeted mutation analysis, documentation, and final verification pass.
- Invoke the project-local `feature-*` skills manually while the workflow is being evaluated.
- Update `docs/architecture/overview.md` whenever a feature changes runtime, data, security, provider, or operational behavior.


## Security

- Never return email, phone, or reminder rows from public APIs (see `app/api/campaigns/[slug]/state`).
- Never send `SUPABASE_SERVICE_ROLE_KEY` to the browser.
- RLS is on with **no anon policies**; the service role bypasses RLS.
- Claimants edit/release only through a hashed, HttpOnly 15-minute capability; enforce the window in the database RPC.
- Organizer administration uses invite-only Supabase Auth plus campaign membership. Verify `auth.getUser()` and membership before service-role data access.
- TwiML (`/api/voice/reminder`) must validate the Twilio request signature.
- Cron (`/api/cron/reminders`) requires `Authorization: Bearer $CRON_SECRET`.
- Do not store card data. Payments are a later phase (Stripe Checkout / Billing).

## Data

- Live databases: use **additive** SQL (`supabase/migrate-*.sql`). Apply `migrate-claimant-organizer-access.sql` after `migrate-reminders.sql`. Never run `migrate-theme-deadline.sql` after `migrate-reminders.sql` (it would overwrite `create_campaign`).
- `supabase/schema.sql` **drops and recreates** tables. Do not run it against a DB with real signups.
- New campaigns today: SQL `create_campaign(...)`. Avoid reserved slugs in `lib/reserved.ts`.

## Reminders

- Reminder presentation, enrollment, and sending are globally fail-closed behind `ENABLE_EMAIL_REMINDERS=true` plus configured `RESEND_API_KEY` and `RESEND_FROM`. Keep the flag false for the Biala launch.
- Opt-in at claim. Contacts stay off the public board.
- Email: Resend via `lib/email.ts` (`sendEmail`). Voice: Twilio via `lib/voice.ts`. Add future channels (WhatsApp, SMS) as adapters next to those, not a second engine.
- Email is free at current scale (Resend free tier). Voice is paid; keep the per-run cap.
- Reminder opt-in always requires a valid email so the learner receives confirmations and the management link.
- The retained email implementation uses the daily Hobby cron and does not promise a user-selected time, but the current release exposes no reminders while the global gate is false.
- Precise scheduling is a later channel-agnostic capability on the shared reminder engine: per-reminder local time + IANA timezone backed by a frequent scheduler. It is required before exposing phone/SMS/WhatsApp and may later be offered optionally for email.
- Voice remains behind `ENABLE_VOICE_REMINDERS`; credentials alone must not expose it. When the later phase ships, require a channel-specific contact, validate E.164-compatible phone input, and reject unavailable channels at the API boundary.
- After a successful claim with reminders, show the manage link on the board.
- Claimant-facing copy: 15-minute window to edit or release after claiming; capability and expiry are enforced server-side.

## Tests

```bash
npm test          # Vitest (CI on every PR)
npm run test:e2e  # Playwright smokes (campaign UI; uses E2E_FIXTURE)
```

No live Resend/Twilio in CI. Mock providers. Name the risk each test guards.

## Do not

- Invent k8s, queues, or a microservice split.
- Commit `.env` files or secrets.
- Expose reminder PII on the public board.
- Build public organizer registration, in-app invitations/roles, or Stripe in this phase.

## Later (do not implement yet)

- **Organizer self-service:** public registration, invitations/roles, campaign creation, binary photo upload, deadline/timezone editing, and account recovery. Learners stay anonymous.
- **Paid product:** organizers pay (subscription or per-campaign). Stripe Billing + Checkout + Customer Portal + signed webhooks. Learners never see a payment UI. Cap Twilio/WhatsApp usage in the plan so one campaign cannot run up the bill.
- **WhatsApp** is the preferred later reminder channel for this audience; SMS is the easier fallback. Extend `reminder_sends.channel`, do not rewrite the job.
- Kubernetes is the wrong next hosting step if Vercel is the constraint (Cloud Run / Fly / a VM first).
