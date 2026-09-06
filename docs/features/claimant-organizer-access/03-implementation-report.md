# Implementation report: claimant editing and organizer administration

## Approved inputs

- Specification: `01-spec.md`
- Plan: `02-implementation-plan.md`

## Delivered behavior

- `REQ-ACCESS-001` / `AC-ACCESS-001`: claims now generate a 256-bit capability, persist its SHA-256 hash through `claim_tractate`, and set a 15-minute HttpOnly cookie only after success.
- `REQ-ACCESS-002` / `AC-ACCESS-002`: public state projects `can_edit` and `edit_until` only when the request has the matching cookie; the client hides expired controls.
- `REQ-ACCESS-003` / `AC-ACCESS-003` / `AC-ACCESS-004`: claimant edit calls a capability RPC; rename preserves `claimed_at`, while release deletes reminders and clears claim/capability atomically.
- `REQ-ACCESS-004` / `AC-ACCESS-005`: `/admin/login` requests Supabase magic links with user creation disabled; the callback exchanges the code for a cookie session.
- `REQ-ACCESS-005` / `AC-ACCESS-006`: a centralized organizer guard requires `auth.getUser()` plus campaign membership.
- `REQ-ACCESS-006` / `AC-ACCESS-007`: authorized organizers can edit campaign content and theme from a separate interface.
- `REQ-ACCESS-007` / `AC-ACCESS-008`: the admin campaign page shows board-safe tractate fields and supports rename/atomic release.
- `REQ-ACCESS-008` / `AC-ACCESS-009`: public password state and route authorization were removed; the environment example no longer defines `ADMIN_PASSWORD`.
- `REQ-ACCESS-009` / `AC-ACCESS-010`: admin forms use RAC DS controls, stack at phone widths, and preserve minimum touch targets.

## Changed files

- Added:
  - `supabase/migrate-claimant-organizer-access.sql`
  - `lib/claim-capability.ts`, `lib/supabase-auth.ts`, `lib/organizer-auth.ts`, `lib/admin-validation.ts`
  - `middleware.ts`, auth callback, admin login/logout and mutation APIs
  - admin pages and `components/admin/` composites
  - `components/ds/TextArea.tsx`, `components/ds/Select.tsx`
- Modified:
  - public claim/state/edit routes, `lib/reminder-job.ts`, `CampaignClient.tsx`
  - `supabase/schema.sql`, `.env.local.example`, `package.json`, lockfile
  - `components/ds/Button.tsx` to establish a client boundary for server-rendered pages.
- Removed:
  - `verifyAdminPassword` and all production use of the shared password.

## Data and deployment changes

- Apply `supabase/migrate-claimant-organizer-access.sql` after reminder migrations and before this application build.
- Configure `NEXT_PUBLIC_SUPABASE_ANON_KEY`, Supabase Auth redirect URLs, production SMTP, invited Auth users, and `campaign_memberships`.
- `@supabase/ssr` is a new runtime dependency.
- Rollback can restore the prior application build while leaving additive columns/table/functions in place; the new claim function keeps the final token argument optional.

## Verification performed

- Type/lint: `npm run build` passed with Next.js type validation.
- Unit/API: deferred to the mapped test stage.
- Component/E2E: deferred to the mapped test stage.
- Manual/responsive: structural review confirms stacked phone layouts and RAC controls; browser verification remains mapped.

## Deviations

- The plan mentioned `CLAIM_EDIT_COOKIE_SECURE`; no environment override was added. Production security derives directly from `NODE_ENV`, preventing accidental insecure production cookies.
- No other deviations.

## Known limitations

- Organizer invitations and membership assignments remain operator-managed.
- Campaign image editing accepts an HTTPS/internal URL; binary upload remains out of scope.
- Existing pre-migration claims do not receive claimant capabilities.

## Handoff

- Status: ready-for-review
- Inputs: approved `01-spec.md` and `02-implementation-plan.md`
- Outputs: implementation and `03-implementation-report.md`
- Open decisions: none
- Deviations: documented above
- Next skill: `feature-test-map`
