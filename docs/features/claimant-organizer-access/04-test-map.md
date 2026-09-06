# Behavior and test map: claimant editing and organizer administration

## Inputs reconciled

- Specification: `01-spec.md`
- Plan: `02-implementation-plan.md`
- Implementation report: `03-implementation-report.md`

## Behavior inventory

- Capability generation, hash stability, slug-safe cookie name, secure cookie attributes, successful-claim issuance, and failed-claim non-issuance.
- State response with matching, missing, wrong, and expired capability, while omitting hash/timestamps for other viewers.
- Claimant rename, release, invalid name, missing token, stale token, RPC error, and cookie deletion.
- Rename does not extend `claimed_at`; release removes reminders transactionally; stale capabilities fail in SQL.
- Login input validation, no user creation, callback success/failure, logout, unauthenticated and non-member behavior.
- Campaign validation, membership isolation, successful campaign update, organizer tractate rename/release, and not-claimed behavior.
- Admin page selects campaign/tractate fields only and never reminders.
- Public board shows edit only for the owning capability, removes password UI, and expires controls.
- Admin form/list stack at 320px/375px, have labeled RAC controls, 44px actions, keyboard paths, and no horizontal overflow.
- Migration contains additive structures, no anon grants, defaulted claim argument, and atomic release functions.

## Traceability map

- `REQ-ACCESS-001`
  - `AC-ACCESS-001`
  - `RISK-ACCESS-001`
  - Behavior: generate/hash token, persist hash, issue cookie only on claim success.
  - Test level: unit and API.
  - Test file/name: `lib/claim-capability.test.ts`; claim route tests.
  - Status: missing.
- `REQ-ACCESS-002`
  - `AC-ACCESS-002`
  - `RISK-ACCESS-002`
  - Behavior: capability-specific state and expiry; no visitor edit button.
  - Test level: API and E2E.
  - Test file/name: state route tests; `e2e/campaign.spec.ts`.
  - Status: missing.
- `REQ-ACCESS-003`
  - `AC-ACCESS-003`, `AC-ACCESS-004`
  - `RISK-ACCESS-002`, `RISK-ACCESS-005`
  - Behavior: valid rename/release, invalid/stale denial, timestamp preservation, atomic reminder deletion.
  - Test level: API plus migration contract.
  - Test file/name: edit route tests; `supabase/migrate-claimant-organizer-access.test.ts`.
  - Status: existing password test is obsolete; replacement missing.
- `REQ-ACCESS-004`
  - `AC-ACCESS-005`
  - `RISK-ACCESS-004`, `RISK-ACCESS-007`
  - Behavior: valid email requests OTP with `shouldCreateUser:false`; callback exchanges code; failures close safely.
  - Test level: API.
  - Test file/name: admin login and callback route tests.
  - Status: missing.
- `REQ-ACCESS-005`
  - `AC-ACCESS-006`
  - `RISK-ACCESS-003`, `RISK-ACCESS-007`
  - Behavior: no user returns 401; no membership returns 403; membership returns scoped service client.
  - Test level: unit/API.
  - Test file/name: `lib/organizer-auth.test.ts`; admin route tests.
  - Status: missing.
- `REQ-ACCESS-006`
  - `AC-ACCESS-007`
  - `RISK-ACCESS-008`
  - Behavior: campaign fields validate; authorized update uses parsed fields only.
  - Test level: unit/API/E2E.
  - Test file/name: `lib/admin-validation.test.ts`; admin campaign route tests; admin fixture E2E.
  - Status: missing.
- `REQ-ACCESS-007`
  - `AC-ACCESS-008`
  - `RISK-ACCESS-005`, `RISK-ACCESS-006`
  - Behavior: organizer rename/release is campaign-scoped and returns no reminder data.
  - Test level: API/E2E.
  - Test file/name: admin tractate route tests; admin fixture E2E.
  - Status: missing.
- `REQ-ACCESS-008`
  - `AC-ACCESS-009`
  - `RISK-ACCESS-003`, `RISK-ACCESS-006`
  - Behavior: no shared password dependency or public password prompt.
  - Test level: static search/unit/E2E.
  - Test file/name: remove obsolete admin password tests; campaign E2E.
  - Status: inadequate until legacy tests/docs are removed.
- `REQ-ACCESS-009`
  - `AC-ACCESS-010`
  - `RISK-ACCESS-008`
  - Behavior: labeled/keyboard controls, reachable actions, no phone overflow.
  - Test level: E2E.
  - Test file/name: phone-width campaign/admin Playwright cases.
  - Status: claimant mobile test exists; admin coverage missing.

## Boundary analysis

- Client validation: Zod validates claim/login/admin input before fetch; API repeats validation.
- API validation: reject malformed ids, JSON, names, emails, URLs, and themes.
- Authorization: HttpOnly capability and organizer session+membership are independent fail-closed boundaries.
- Database integrity: claim and release behavior is transactionally encoded in functions; application tests assert RPC usage, migration tests assert SQL controls.
- Provider failure: Supabase Auth request/exchange failures return generic errors; no account enumeration.
- Concurrency: SQL row locks and claim conditions control release/reclaim; deterministic unit tests assert contract and live migration smoke remains operational.
- Mobile/accessibility: Playwright checks viewports, labels, action reachability, and overflow.

## Test gaps

1. Replace shared-password tests and update reminder-job claim fixtures.
2. Add capability unit/API tests.
3. Add login, organizer guard, validation, and admin mutation tests.
4. Add SQL migration contract tests.
5. Update campaign E2E for capability edit and add admin phone fixture coverage.
6. Run full Vitest/build/Playwright and reconcile failures.

## Mutation scope

- `lib/claim-capability.ts`
- `lib/admin-validation.ts`
- `lib/organizer-auth.ts`
- `app/api/campaigns/[slug]/edit/route.ts`
- `app/api/admin/campaigns/[id]/route.ts`
- `app/api/admin/campaigns/[id]/tractates/[tractateId]/route.ts`
- Exclude auth callback/middleware from initial mutation because cookie exchange is integration-heavy and route contract tests provide deterministic branch coverage.
- Exclude React presentation until a DOM component runner is configured; Playwright guards those behaviors.

## Handoff

- Status: ready-for-review
- Inputs: approved upstream artifacts and current implementation
- Outputs: `04-test-map.md`
- Open decisions: none
- Deviations: none
- Next skill: `feature-test`
