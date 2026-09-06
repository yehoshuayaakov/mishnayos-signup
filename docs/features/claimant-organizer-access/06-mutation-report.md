# Mutation report: claimant editing and organizer administration

## Scope

- Mutated modules:
  - `lib/claim-capability.ts`, `lib/admin-validation.ts`, `lib/organizer-auth.ts`
  - claimant capability edit route
  - organizer campaign and tractate mutation routes
- Excluded modules and rationale:
  - auth callback/middleware require session-cookie integration rather than useful isolated mutants;
  - React presentation is covered by Playwright until a DOM component runner exists;
  - SQL is covered by explicit contract tests and staging migration smoke.
- Commands:
  - `npm run test:mutation -- --mutate "lib/@(claim-capability|admin-validation|organizer-auth).ts"`
  - `npm run test:mutation -- --mutate "app/api/campaigns/*/edit/route.ts"`
  - `npm run test:mutation -- --mutate "app/api/admin/campaigns/*/route.ts"`
  - `npm run test:mutation -- --mutate "app/api/admin/campaigns/*/tractates/*/route.ts"`
- Stryker configuration: Vitest runner, per-test coverage, two workers, clear-text/JSON/HTML reports, break threshold 0 during baseline evaluation.

## Baseline

- Initial domain run: 108 mutants, 54 killed, 18 survived, 36 no coverage, 50.00% total.
- Initial claimant route run: 93 mutants, 48 killed, 19 survived, 26 no coverage, 51.61% total.
- Initial campaign route run: 57 mutants, 20 killed, 14 survived, 23 no coverage, 35.09% total.
- Initial tractate route run: 86 mutants, 31 killed, 22 survived, 33 no coverage, 36.05% total.
- Timeout/error: 0.

## Survivor analysis

- Validation survivors mapped to `AC-ACCESS-007` and `RISK-ACCESS-008` exposed missing assertions for trimming, limits, protocols, and issue messages. Tests were strengthened.
- Capability survivors mapped to `AC-ACCESS-001` and `RISK-ACCESS-001` exposed missing production/development cookie assertions. Tests were strengthened; an explicit UTF-8 encoding argument equivalent to Node’s default was removed.
- Membership survivors mapped to `AC-ACCESS-006` and `RISK-ACCESS-003` exposed unasserted select/filter columns and authorization-error branches. Tests now verify exact query contracts and fail-closed states.
- Route survivors mapped to `AC-ACCESS-003`, `AC-ACCESS-004`, `AC-ACCESS-007`, `AC-ACCESS-008`, and risks `RISK-ACCESS-002`, `RISK-ACCESS-003`, `RISK-ACCESS-005`, `RISK-ACCESS-008`. Added malformed input, boundary ids, error payloads, auth failures, database failures, query argument, cookie clearing, and success payload assertions.
- A static helper-function mutant could not observe schema initialization reliably; the helper was removed and field schemas were made explicit rather than accepting an untestable rationale.

## Final result

- Domain modules: 112 generated, 112 killed, 0 survived/no-coverage, 100%.
- Claimant edit route: 93 generated, 93 killed, 0 survived/no-coverage, 100%.
- Organizer campaign route: 57 generated, 57 killed, 0 survived/no-coverage, 100%.
- Organizer tractate route: 86 generated, 86 killed, 0 survived/no-coverage, 100%.
- Combined targeted result: 348/348 mutants killed; no unresolved survivor, timeout, error, or no-coverage mutant.

## Threshold recommendation

Keep the repository-wide break threshold at 0 until the first scheduled full mutation baseline is measured. For targeted feature modules, require no unresolved meaningful survivors; after two more pilots, consider a 90% numeric floor while retaining survivor review.

## Handoff

- Status: ready-for-review
- Inputs: green deterministic suite and approved mutation scope
- Outputs: strengthened tests/fixes and `06-mutation-report.md`
- Open decisions: none
- Deviations: mutation targets were run as four valid glob commands because repeated CLI `--mutate` values retain only the final pattern
- Next skill: `feature-document`
