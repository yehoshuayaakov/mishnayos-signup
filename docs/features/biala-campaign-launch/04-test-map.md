# Behavior and test map: Biala Ostrova campaign launch

## Inputs reconciled

- Specification: `01-spec.md`
- Plan: `02-implementation-plan.md`
- Implementation report: `03-implementation-report.md`

## Behavior inventory

- Global success: reminders are available only when the explicit flag, API key, and sender are all present.
- Global disabled state: absent, false, differently cased, or incompletely configured values fail closed.
- UI disabled state: claim dialog contains no reminder switch, fields, channel copy, or management promise.
- Client defense: hidden reminder state is not validated or included in a claim request.
- API validation: `reminders: true` returns `400 reminders_unavailable` after campaign existence is established but before service-client acquisition or claim execution.
- API compatibility: ordinary claims without reminder intent keep validation, duplicate conflict, capability cookie, and success behavior.
- Job safety: the globally disabled reminder job returns zero counts without querying Supabase or calling email/voice providers.
- Campaign creation: SQL is rerunnable without creating a duplicate slug and supplies the exact approved Hebrew content, photo path, theme, support email, timezone, and deadline timestamp.
- Empty campaign: standard `create_campaign` seeds 64 tractates and zero claims.
- Public rendering: the direct campaign route renders the content and photo; missing image fallback remains unchanged.
- Root behavior: production `/` redirects to `/biala-ostrova-rebbe`.
- Authorization: launch needs operator Supabase access but no organizer membership or login.
- Privacy: only the explicitly public support address is rendered; reminder contact rows remain absent from public state.
- Concurrency: the unchanged atomic claim RPC continues to return the existing duplicate conflict.
- Claimant access: the unchanged 15-minute private capability still controls rename/release.
- Responsive/accessibility: the board and claim dialog have no horizontal overflow at 320px/375px; actions remain in view and labeled controls remain keyboard/addressable.
- Rollback: keeping the global flag false makes provider work unavailable independently of campaign/root rollback.

## Traceability map

- `REQ-BIALA-001` / `AC-BIALA-001`
  - Behavior: campaign-level availability was superseded by approved amendment.
  - Test level: not applicable.
  - Test file/name: specification and plan artifact validation.
  - Status: superseded; must not result in a campaign column or migration.
- `REQ-BIALA-002` / `AC-BIALA-002`
  - Behavior: disabled claim dialog omits every reminder control/copy at desktop, 375px, and 320px.
  - Test level: E2E responsive integration.
  - Test file/name: `e2e/campaign.spec.ts` — replace reminder opt-in coverage and update phone dialog test.
  - Status: existing tests are now misleading and require replacement.
- `REQ-BIALA-003` / `AC-BIALA-003` / `RISK-BIALA-001`
  - Behavior: crafted enrollment is rejected before service-client acquisition and claim transaction; normal claim still succeeds.
  - Test level: API.
  - Test file/name: `app/api/campaigns/[slug]/claim/route.test.ts`.
  - Status: missing disabled-gate test; existing normal-claim tests provide regression coverage after explicit enabled mocking.
- `REQ-BIALA-004` / `AC-BIALA-004` / `RISK-BIALA-002`
  - Behavior: disabled reminder job returns zero counts without a database query or provider call.
  - Test level: unit/domain.
  - Test file/name: `lib/reminder-job-run.test.ts`.
  - Status: missing; existing job tests must explicitly mock the gate enabled.
- `REQ-BIALA-005` / `AC-BIALA-005`
  - Behavior: authored SQL contains the exact content, navy theme, photo, support address, and `2026-09-30 23:59:59+03` / `Asia/Jerusalem`.
  - Test level: deterministic SQL contract plus production integration.
  - Test file/name: `supabase/create-biala-ostrova-rebbe.test.ts`; production smoke checklist.
  - Status: missing.
- `REQ-BIALA-005` / `AC-BIALA-009`
  - Behavior: learner claims, sees duplicate conflict, and uses capability rename/release.
  - Test level: E2E and API/database smoke.
  - Test file/name: existing `e2e/campaign.spec.ts` claim/duplicate/edit tests; production smoke checklist.
  - Status: existing deterministic fixture coverage; production integration pending.
- `REQ-BIALA-006` / `AC-BIALA-006` / `RISK-BIALA-006`
  - Behavior: release root redirects to the Biala slug while its direct URL remains available.
  - Test level: E2E fixture for redirect mechanism and production HTTP smoke for configured value.
  - Test file/name: `e2e/campaign.spec.ts`; production smoke checklist.
  - Status: direct route fixture coverage exists; explicit root assertion and production check missing.
- `REQ-BIALA-007` / `AC-BIALA-007` / `RISK-BIALA-004`
  - Behavior: approved temporary address appears only as public authored instructions; public state exposes no reminder PII.
  - Test level: SQL contract, existing state API security test, production visual smoke.
  - Test file/name: new campaign SQL test; existing `app/api/campaigns/[slug]/state/route.test.ts`; production smoke.
  - Status: SQL and production assertions missing; API privacy coverage existing.
- `REQ-BIALA-008` / `AC-BIALA-008`
  - Behavior: campaign script uses the operator-only creation function and no membership/Auth operation.
  - Test level: SQL contract plus manual operator verification.
  - Test file/name: new campaign SQL test; deployment checklist.
  - Status: missing.
- `REQ-BIALA-009` / `AC-BIALA-010` / `RISK-BIALA-003`
  - Behavior: exact true flag plus both provider values is required; all other combinations are false.
  - Test level: pure unit.
  - Test file/name: `lib/email-reminder-availability.test.ts`.
  - Status: missing.
- `RISK-BIALA-005`
  - Behavior: stored real deadline is the approved Jerusalem end-of-day instant while the supplied Hebrew text is unchanged.
  - Test level: SQL contract and database integration.
  - Test file/name: new campaign SQL test; post-create query.
  - Status: missing.
- `RISK-BIALA-007`
  - Behavior: no destructive schema file is used; prerequisite migrations are inspected before campaign creation.
  - Test level: source contract and manual deployment gate.
  - Test file/name: new campaign SQL test rejects destructive statements; deployment checklist.
  - Status: missing.
- `RISK-BIALA-008`
  - Behavior: superseded; no campaign-level enablement exists.
  - Test level: source/schema search during verification.
  - Test file/name: final verification checklist.
  - Status: missing verification assertion.

## Boundary analysis

- Client validation: hidden state must never make email required or add reminder fields to the request; E2E route interception should inspect the payload.
- API validation: campaign-not-found behavior remains distinguishable; only literal `reminders: true` is enrollment intent under the existing parser contract.
- Authorization: no new browser-accessible administration is introduced. Service-role and claimant capability boundaries remain covered by existing suites.
- Database integrity: campaign slug uniqueness and atomic claim behavior remain database responsibilities. The creation script adds an idempotent existence guard.
- Provider failure: disabled mode must not reach providers. Live Resend behavior is out of scope and must not run in deterministic tests.
- Concurrency: unchanged claim RPC tests and duplicate E2E cover the boundary; no new transaction is introduced.
- Mobile/accessibility: assert absence of horizontal overflow at both required widths, visible primary/cancel actions, and absence of hidden reminder labels/text.

## Test gaps

1. Add a complete truth-table unit suite for the global gate (`RISK-BIALA-003`).
2. Mock the gate enabled in existing claim API tests, then add a disabled crafted-request test proving no service client/RPC call (`RISK-BIALA-001`).
3. Mock the gate enabled in existing reminder-job tests, then add a disabled early-return test proving no query/provider call (`RISK-BIALA-002`).
4. Replace E2E reminder-enrollment expectations with desktop/320px/375px absence, payload, overflow, and reachable-action assertions (`AC-BIALA-002`).
5. Add root redirect fixture coverage (`RISK-BIALA-006`).
6. Add a campaign SQL source-contract suite for exact content, idempotence, non-destructive behavior, no Auth/membership writes, deadline, and support address (`RISK-BIALA-004`, `RISK-BIALA-005`, `RISK-BIALA-007`).
7. Run existing API/unit/E2E suites to guard ordinary claim, duplicate, capability, privacy, and organizer behavior.
8. Reserve direct URL, root redirect, 64-row database state, public rendering, real claim/edit/release, no reminder row, and phone viewport checks for post-deployment smoke because fixtures cannot prove live configuration.

## Mutation scope

- Mutate all of `lib/email-reminder-availability.ts`; every boolean condition and exact flag comparison is material.
- Mutate `app/api/campaigns/[slug]/claim/route.ts`; existing route coverage plus the new guard should distinguish validation order, status, error, and forbidden calls.
- Mutate the `runReminderJob` region of `lib/reminder-job.ts`; exclude unrelated scheduling/copy functions already analyzed by the reminders feature.
- Exclude JSX/Tailwind mutations: the meaningful observable behavior is more reliably covered by Playwright, while class-string mutations create noisy equivalent mutants.
- Exclude the binary photo and SQL syntax from Stryker; deterministic source contracts and live post-create verification cover them.

## Handoff

- Status: ready-for-review
- Inputs: approved upstream artifacts and current implementation
- Outputs: `04-test-map.md`
- Open decisions: none
- Deviations: superseded campaign-level behavior is explicitly mapped as not applicable
- Next skill: `feature-test`
