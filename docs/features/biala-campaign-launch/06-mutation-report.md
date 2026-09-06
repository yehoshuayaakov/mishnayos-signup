# Mutation report: Biala Ostrova campaign launch

## Scope

- Mutated modules:
  - `lib/email-reminder-availability.ts`
  - `app/api/campaigns/[slug]/claim/route.ts`
  - changed guard lines 196–198 in `lib/reminder-job.ts`
- Excluded modules and rationale:
  - JSX/Tailwind presentation is asserted with Playwright rather than class-string mutation.
  - SQL and the binary photo are outside Stryker’s executable TypeScript scope.
  - Unchanged reminder query/scheduling/provider logic below the new early-return guard is outside this feature; an exploratory broad run is recorded below.
- Commands:
  - `npm run test:mutation -- --mutate "lib/email-reminder-availability.ts"`
  - `npm run test:mutation -- --mutate "app/api/campaigns/*/claim/route.ts"`
  - `npm run test:mutation -- --mutate "lib/reminder-job.ts:196-198"`
- Stryker configuration: Vitest runner, per-test coverage, two workers, 15-second timeout, configured break threshold 0.

## Baseline

- Tests: Stryker-selected related Vitest tests; all dry runs passed.
- Mutants generated:
  - availability helper: 13
  - claim route: 88
  - exploratory full `runReminderJob` region: 91
- Killed: 112
- Survived: 38
- No coverage: 42
- Timeout/error: 0 mutation errors; one discarded CLI attempt used an unescaped bracket glob and found no files.
- Mutation score:
  - availability helper: 84.62% (11 killed, 2 survived)
  - claim route: 69.32% total / 89.71% covered (61 killed, 7 survived, 20 no coverage)
  - exploratory job region: 43.96% total / 57.97% covered (40 killed, 29 survived, 22 no coverage)

## Survivor analysis

- Optional chaining on absent `RESEND_API_KEY` and `RESEND_FROM`
  - Related: `REQ-BIALA-009`, `AC-BIALA-010`, `RISK-BIALA-003`
  - Classification: test gap
  - Resolution: added absent-variable cases, distinct from empty/whitespace cases.
  - Evidence: helper rerun killed all 13 mutants.
- Claim route validation and error contracts
  - Related: `REQ-BIALA-003`, `AC-BIALA-003`, `AC-BIALA-009`, `RISK-BIALA-001`
  - Classification: test gaps in existing route behavior
  - Resolution: added malformed JSON, invalid id, unknown campaign, status-body, no-deadline non-week-before, duplicate body, configuration failure, and transaction failure assertions.
  - Evidence: route rerun killed all 88 mutants with no uncovered mutants.
- Existing reminder query, scheduling, email-result, and voice-result branches below the global guard
  - Related: not introduced or changed by this launch; unreachable in the production disabled state.
  - Classification: excluded pre-existing scope, not equivalent mutants
  - Resolution: narrowed final mutation range to the changed fail-closed guard. The exploratory survivors are explicitly not claimed equivalent and must be revisited by the future reminder-launch feature before enabling the global flag.
  - Evidence: changed guard generated four mutants and the disabled/enabled job tests killed all four.

## Final result

- Deterministic focused suites remained green after strengthening.
- Final approved changed scope:
  - Mutants generated: 105
  - Killed: 105
  - Survived: 0
  - No coverage: 0
  - Timeout/error: 0
  - Mutation score: 100%
- No business-critical non-equivalent survivor remains in code introduced or changed for the global reminder shutdown.

## Threshold recommendation

- Require 100% for this small, security-relevant release-gate scope.
- Keep the repository-wide configured high threshold at 80 until the older reminder job’s enabled-path suite is intentionally expanded; do not enable reminders based on the global score alone.

## Handoff

- Status: ready-for-review
- Inputs: green deterministic suite and approved mutation scope
- Outputs: strengthened route/helper tests and `06-mutation-report.md`
- Open decisions: none
- Deviations: final reminder-job mutation range was narrowed from an exploratory whole-function run to the three changed guard lines; all broad-run survivors remain documented as future reminder-launch test debt
- Next skill: `feature-document`
