# Test report: Biala Ostrova campaign launch

## Test-map inputs

- Behavior map: `04-test-map.md`
- Gaps addressed: global fail-closed truth table, claim API rejection and ordinary-claim compatibility, reminder-job early return, campaign SQL contract, hidden responsive UI, request payload, and root redirect.

## Tests added or changed

- Unit — `lib/email-reminder-availability.test.ts`
  - `AC-BIALA-010 enables reminders only with the explicit flag and provider config`
  - `RISK-BIALA-003 fails closed when <setting> is empty`
  - `RISK-BIALA-003 rejects the non-explicit flag value <value>`
  - `RISK-BIALA-003 treats whitespace-only <provider value> as missing`
  - Guards the boolean gate and exact configuration boundary for `REQ-BIALA-009`.
- API — `app/api/campaigns/[slug]/claim/route.test.ts`
  - `RISK-BIALA-001 rejects reminder enrollment before claim execution when disabled`
  - `AC-BIALA-009 allows an ordinary claim while reminders are disabled`
  - Existing reminder-validation tests explicitly run with the gate mocked on.
  - Guards `REQ-BIALA-003`, `AC-BIALA-003`, and unchanged normal claiming.
- Domain — `lib/reminder-job-run.test.ts`
  - `RISK-BIALA-002 does not query or call providers while reminders are disabled`
  - Existing job behavior explicitly runs with the gate mocked on.
  - Guards `REQ-BIALA-004` and `AC-BIALA-004`.
- SQL source contract — `supabase/create-biala-ostrova-rebbe.test.ts`
  - Verifies exact campaign content/photo/theme (`REQ-BIALA-005`, `AC-BIALA-005`).
  - Verifies only the approved public support address (`REQ-BIALA-007`, `RISK-BIALA-004`).
  - Verifies the explicit Jerusalem deadline (`RISK-BIALA-005`).
  - Verifies operator creation without Auth/membership writes (`REQ-BIALA-008`, `AC-BIALA-008`).
  - Verifies idempotence and absence of destructive operations (`RISK-BIALA-007`).
- E2E — `e2e/campaign.spec.ts`
  - `AC-BIALA-002 reminder controls and copy are hidden in the claim dialog`.
  - Claim test now asserts the submitted payload contains only tractate id and claimant name.
  - Phone-width test covers 320px and 375px without reminder controls and with both actions in view.
  - `AC-BIALA-006 root redirects to the configured campaign`.
  - Existing claim, duplicate, capability release, privacy, admin responsiveness, and reminder-management regression tests remain green.

## Results

- Type/lint:
  - `node_modules/.bin/tsc.cmd --noEmit --incremental false --pretty false` — passed.
  - IDE diagnostics for changed production/test files — no errors.
- Unit/API:
  - Focused Vitest command — 4 files, 29 tests passed.
  - `npm test` — 27 files, 113 tests passed.
- Component:
  - No isolated component harness exists; interactive behavior is covered at the browser boundary.
- E2E:
  - `npm run test:e2e` — 9 tests passed.
- Responsive/accessibility:
  - 320px and 375px dialog overflow/action checks passed; role/label locators confirmed accessible naming.
- Migration/integration:
  - No new migration exists. Campaign SQL contract tests passed.

## Remaining gaps

- Production database creation, exact 64-row result, direct URL, real root redirect, rendered photo/content, and claim/edit/release are deployment-stage smoke checks because fixture tests cannot prove live configuration.
- No live Resend call is permitted or required: reminders are intentionally disabled and deterministic tests prove provider functions are not reached.
- Browser tests verify Chrome-based desktop/phone viewports; manual production phone verification remains part of rollout.

## Mutation readiness

The deterministic test suite is green. Approved mutation targets:

- `lib/email-reminder-availability.ts`
- `app/api/campaigns/[slug]/claim/route.ts`
- the `runReminderJob` region of `lib/reminder-job.ts`

## Handoff

- Status: ready-for-review
- Inputs: approved `04-test-map.md`
- Outputs: tests and `05-test-report.md`
- Open decisions: none
- Deviations: no campaign-specific fixture was added because the approved amendment replaced campaign-level availability with one global release state
- Next skill: `feature-mutation`
