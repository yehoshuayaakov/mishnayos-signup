---
name: feature-mutation
description: Runs targeted StrykerJS mutation analysis against feature business logic and API handlers, resolves meaningful survivors, and records mutation evidence. Use after deterministic feature tests pass.
disable-model-invocation: true
---

# Feature mutation analysis

## Required input

- Approved `04-test-map.md`
- Green `05-test-report.md`
- Exact mutation scope listed by the test stage

## Instructions

1. Confirm deterministic tests pass before mutation.
2. Mutate only mapped feature/changed source modules:
   `npm run test:mutation -- --mutate "<path-or-glob>"`.
3. Do not mutate tests, generated files, type-only files, SQL, or presentation code that the Vitest runner cannot execute.
4. Analyze every survivor:
   - add a missing behavior test;
   - fix an implementation defect;
   - or document why the mutant is genuinely equivalent.
5. Never mark a meaningful survivor equivalent merely to improve the score.
6. Rerun targeted deterministic tests and mutation analysis after changes.
7. Create `06-mutation-report.md` from the template with exact counts, command, scope, and survivor decisions.
8. Recommend thresholds from measured results only.
9. Complete the handoff and stop. Do not update architecture or delivery docs.

## Quality gate

- No unresolved business-critical non-equivalent survivor.
- No-coverage mutants are mapped to a test gap or justified exclusion.
- Generated reports remain ignored and are attached only as CI artifacts.

## Output

Tests or in-scope fixes plus `docs/features/<feature>/06-mutation-report.md`, with `Next skill: feature-document`.
