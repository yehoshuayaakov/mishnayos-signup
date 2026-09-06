# Implementation plan: claimant editing and organizer administration

## Approved inputs

- Specification: `01-spec.md`
- Approved amendments: none

## Architecture and approach

Use two independent authorization mechanisms:

1. `REQ-ACCESS-001` through `REQ-ACCESS-003`: claimant capabilities use a 32-byte random token in a per-tractate HttpOnly cookie and a SHA-256 hash in Postgres. Public state computes `can_edit`/`edit_until` only when the request cookie matches. A database RPC enforces hash and 15-minute age for rename/release.
2. `REQ-ACCESS-004` through `REQ-ACCESS-007`: organizer sessions use Supabase Auth magic links. Server code calls `auth.getUser()`, then uses the service role only after a `campaign_memberships` lookup.

The public claimant path and organizer path share no password or token. Keep the modular monolith; do not add a separate service.

## Requirement mapping

- `REQ-ACCESS-001` / `AC-ACCESS-001`: `lib/claim-capability.ts`, claim route cookie, token-hash column.
- `REQ-ACCESS-002` / `AC-ACCESS-002`: state-route capability projection and client expiry timer.
- `REQ-ACCESS-003` / `AC-ACCESS-003` / `AC-ACCESS-004`: `edit_claim_with_capability` and `release_tractate` RPCs plus capability edit route.
- `REQ-ACCESS-004` / `AC-ACCESS-005`: invite-only login and auth callback using `@supabase/ssr`.
- `REQ-ACCESS-005` / `AC-ACCESS-006`: centralized `requireCampaignMembership`.
- `REQ-ACCESS-006` / `AC-ACCESS-007`: admin campaign editor API and composite.
- `REQ-ACCESS-007` / `AC-ACCESS-008`: admin tractate API/list without reminder fields.
- `REQ-ACCESS-008` / `AC-ACCESS-009`: remove password state/UI and legacy password mutation behavior.
- `REQ-ACCESS-009` / `AC-ACCESS-010`: DS-first controls and responsive E2E.

## File and component changes

- Add:
  - `supabase/migrate-claimant-organizer-access.sql`
  - `lib/claim-capability.ts`, `lib/supabase-auth.ts`, `lib/organizer-auth.ts`, `lib/admin-validation.ts`
  - `middleware.ts`, `app/auth/callback/route.ts`
  - `app/admin/login/page.tsx`, `app/admin/page.tsx`, `app/admin/campaigns/[id]/page.tsx`
  - `components/ds/TextArea.tsx`, `components/ds/Select.tsx`
  - `components/admin/AdminLoginForm.tsx`, `AdminCampaignEditor.tsx`
  - `app/api/admin/login/route.ts`, `logout/route.ts`, `campaigns/[id]/route.ts`, `campaigns/[id]/tractates/[tractateId]/route.ts`
- Modify:
  - claim/state/edit campaign routes, `CampaignClient.tsx`, `claimWithOptionalReminder`, environment docs, schema reset reference, and tests.
- Remove:
  - public admin-password field/session behavior and `verifyAdminPassword` usage.
- DS-first prerequisites:
  - Add reusable RAC TextArea and Select before composing admin forms.

## Data and migrations

- Add `tractates.claim_edit_token_hash text`.
- Create `campaign_memberships(user_id uuid references auth.users, campaign_id bigint references campaigns, role text, primary key(user_id,campaign_id))`.
- Enable RLS with no anon policies; grant table access only to service role/postgres.
- Replace `claim_tractate` with a backward-compatible final token-hash argument defaulting to null.
- Add `edit_claim_with_capability` to atomically validate campaign/id/hash/`claimed_at >= now()-15 minutes`, rename without touching `claimed_at`, or release plus delete reminders.
- Add `release_tractate` for organizer release in one transaction.
- Mirror the final schema in `schema.sql` for fresh installs, while live rollout uses only the additive migration.
- Deploy migration before application code; rollback disables new UI/routes but retains additive columns/tables.

## Security and privacy

- `RISK-ACCESS-001`: token helper generates 256-bit random tokens, hashes before storage, uses timing-safe comparison where application comparison occurs, and sets HttpOnly/SameSite cookies.
- `RISK-ACCESS-002`: expiry is checked inside the RPC, not trusted from `edit_until`.
- `RISK-ACCESS-003`: all admin loaders/routes call one membership guard before service-role campaign data access.
- `RISK-ACCESS-004`: login uses `shouldCreateUser: false`; membership remains mandatory even for authenticated users.
- `RISK-ACCESS-005`: both claimant and organizer release use atomic SQL functions.
- `RISK-ACCESS-006`: admin queries select campaign and tractate columns only.
- `RISK-ACCESS-007`: middleware refreshes Supabase auth cookies; callback validates code exchange; logout clears session.
- `RISK-ACCESS-008`: shared Zod validation restricts lengths, theme, and photo URL protocol.

## Test strategy

- Unit: token entropy/hash/cookie naming; campaign validation; membership guard branches.
- API: claim sets secure cookie; state marks only matching capability; claimant edit valid/expired/invalid; login no-create; admin membership denial; campaign/tractate mutations and PII-safe selects.
- SQL contract: mocked RPC arguments plus migration assertions for atomic functions and grants.
- E2E: claimant sees edit after claim, visitor does not, rename/release behavior, admin login/access fixture, campaign editing, tractate editing.
- Responsive/accessibility: claimant and admin pages at 320px/375px and desktop; labels, keyboard actions, no overflow.
- Mutation: capability helper, validation, membership guard, and claimant/admin route handlers.

## Rollout and rollback

- Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `CLAIM_EDIT_COOKIE_SECURE` defaults; production secure cookies derive from environment.
- Configure Supabase Auth redirect URL `/auth/callback` and production SMTP.
- Invite users and insert memberships before exposing `/admin`.
- Deploy migration first, application second, smoke claimant and organizer flows, then remove `ADMIN_PASSWORD`.
- Rollback application code only; additive data remains safe.

## Implementation sequence

1. Add migration/schema and capability/auth domain helpers.
2. Add DS TextArea/Select.
3. Convert public edit behavior to claimant capability.
4. Add auth callback/login/logout and membership guard.
5. Add admin pages/APIs/composites.
6. Remove shared-password behavior and update environment/documentation.
7. Run focused deterministic checks before test mapping.

## Open decisions

- None.

## Handoff

- Status: ready-for-review
- Inputs: approved `01-spec.md`
- Outputs: `02-implementation-plan.md`
- Open decisions: none
- Deviations: none
- Next skill: `feature-implement`
