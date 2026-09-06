# Implementation plan: Biala Ostrova campaign launch

## Approved inputs

- Specification: `01-spec.md`, including the 2026-09-06 global-reminder-shutdown amendment
- Approved release choices: root redirect, supplied photo, Supabase-only administration, temporary public support email

## Architecture and approach

Use one fail-closed global reminder gate. It is enabled only by an explicit production environment value and valid email-provider configuration.

The server page supplies global availability to the existing claim composite, the claim API independently enforces it, and the reminder job refuses all provider work when the gate is off. This satisfies active requirements `REQ-BIALA-002` through `REQ-BIALA-004` and `REQ-BIALA-009` without removing future reminder infrastructure. Superseded `REQ-BIALA-001` is recorded as not applicable; campaign-specific configuration is deferred.

The Biala campaign remains an operator-created database record. Its photo becomes a versioned public asset, its campaign row uses the supplied slug/content/deadline, and Vercel’s `DEFAULT_CAMPAIGN` selects it at `/`. No organizer Auth, payment, or public campaign-creation path is introduced (`REQ-BIALA-005` through `REQ-BIALA-008`).

Rejected alternatives:

- Omitting Resend credentials only: rejected because the UI/API would still accept reminder enrollment.
- UI-only hiding: rejected by `RISK-BIALA-001`.
- Deleting reminder code/tables: rejected because the shutdown is temporary.
- Campaign-level gating: deferred because reminders have not launched and no campaign requires independent availability yet.
- Creating a separate deployment: rejected because the existing multi-campaign architecture already isolates campaign data by slug/id.

## Requirement mapping

- `REQ-BIALA-001` / `AC-BIALA-001`: superseded by the second specification amendment; no implementation.
- `REQ-BIALA-002` / `AC-BIALA-002`: server-derived `remindersAvailable` prop; claim composite omits all reminder presentation when false.
- `REQ-BIALA-003` / `AC-BIALA-003`: claim route checks availability before parsing/storing reminder data or invoking the claim RPC.
- `REQ-BIALA-004` / `AC-BIALA-004`: reminder job exits before querying whenever globally disabled.
- `REQ-BIALA-005` / `AC-BIALA-005` / `AC-BIALA-009`: public photo plus reviewed campaign-creation SQL and standard claim flow.
- `REQ-BIALA-006` / `AC-BIALA-006`: production `DEFAULT_CAMPAIGN=biala-ostrova-rebbe`, followed by root redirect smoke testing.
- `REQ-BIALA-007` / `AC-BIALA-007`: temporary address included in campaign instructions; public API selections remain unchanged.
- `REQ-BIALA-008` / `AC-BIALA-008`: no membership record or organizer Auth dependency; operator uses Supabase.
- `REQ-BIALA-009` / `AC-BIALA-010`: global helper requires explicit enablement and provider configuration; production remains disabled.

## File and component changes

- Add:
  - `lib/email-reminder-availability.ts` and focused unit tests.
  - `supabase/create-biala-ostrova-rebbe.sql` as reviewed one-time campaign data.
  - `public/biala-ostrova-rebbe.jpg` copied from the supplied photo.
- Modify:
  - `app/[slug]/page.tsx` to derive server-side availability.
  - `app/[slug]/CampaignClient.tsx`, `components/claim/ClaimDialog.tsx` to pass availability and omit reminder UI.
  - Claim API to fail before claim execution for disabled reminder payloads.
  - `lib/reminder-job.ts` to enforce the global sending gate.
  - `.env.local.example`, README, architecture, feature docs, fixture, Playwright configuration, and affected tests.
- Remove:
  - Nothing. Existing reminder infrastructure remains dormant.
- DS-first prerequisites:
  - None. This removes an existing optional section and uses existing composites/primitives.

## Data and migrations

- No new reminder-availability schema or migration is introduced.
- The campaign-creation SQL calls `create_campaign(...)` only when the slug does not already exist and then selects the resulting public configuration for operator verification.
- Existing application prerequisites remain: reminders migration → claimant/organizer access migration → campaign creation.
- Rollback keeps the global reminder gate false. Reverting application code while reminder records/providers remain unconfigured is not a release option.

## Security and privacy

- `RISK-BIALA-001`: claim API rejects reminder intent before `claimWithOptionalReminder`; tests assert the RPC is not called.
- `RISK-BIALA-002`: global-off reminder job returns zero provider activity without querying stored rows.
- `RISK-BIALA-003`: global setting is false unless explicitly enabled with configured provider credentials.
- `RISK-BIALA-004`: publish only the explicitly approved temporary email in authored instructions; document that replacement is a campaign-row update.
- `RISK-BIALA-005`: use `2026-09-30 23:59:59+03` and `Asia/Jerusalem`; verify Hebrew and stored dates after creation.
- `RISK-BIALA-006`: verify production direct URL and `/` redirect after Vercel environment update/deployment.
- `RISK-BIALA-007`: inspect migration state first, apply additive files only, and back up before database mutation.
- `RISK-BIALA-008`: superseded because no campaign-level enablement exists.

## Test strategy

- Unit: global flag/provider configuration truth table.
- API: disabled reminder request returns `reminders_unavailable` and does not acquire the service client or call the claim RPC; ordinary no-reminder claim remains valid.
- Domain/job: global-off run does not query or call providers; explicitly enabled test configuration preserves existing email behavior.
- E2E: `e2e-no-reminders` campaign has no reminder text/control at desktop, 375px, and 320px while claiming remains usable; existing reminder UI tests run only under explicit enabled fixture/configuration.
- Campaign data: SQL/photo/content/deadline/static path assertions.
- Deployment smoke: direct/root HTTP, visible content/photo, phone layout, normal claim, duplicate conflict, edit/release, no reminder UI, and no reminder row.
- Mutation: availability helper, claim route, and changed reminder-job business logic; resolve every meaningful survivor.

## Rollout and rollback

1. Implement and complete deterministic, browser, mutation, documentation, and workflow gates.
2. Review the working tree; exclude local screenshots, secrets, caches, and generated reports.
3. Commit logical release units and push `main` to `origin`.
4. Confirm production database backup/schema state.
5. Verify that prerequisite migrations already exist; apply them in documented order only if missing.
6. Run the Biala campaign-creation SQL and verify exactly one campaign plus 64 tractates.
7. Set production `ENABLE_EMAIL_REMINDERS=false` and `DEFAULT_CAMPAIGN=biala-ostrova-rebbe`.
8. Deploy the pushed commit and run all smoke checks.
9. On application failure, keep global reminders disabled and roll Vercel back. Campaign data remains isolated and can be marked inactive if necessary.

## Implementation sequence

1. Add the global availability helper.
2. Thread reminder availability through UI, API, and job.
3. Add tests and fixture behavior for global/campaign disabled states.
4. Copy the supplied photo and add reviewed campaign SQL.
5. Map tests, run deterministic/E2E/mutation gates, and update architecture/operator docs.
6. Validate artifacts and build.
7. Review/commit/push.
8. Apply database/configuration/deployment changes and smoke production.

## Open decisions

- None.

## Handoff

- Status: ready-for-review
- Inputs: approved amended `01-spec.md`
- Outputs: `02-implementation-plan.md`
- Open decisions: none
- Deviations: none
- Next skill: `feature-implement`
