---
name: feature-test-map
description: Reconciles approved requirements with implemented behavior and maps every behavior and risk to an appropriate deterministic test level. Use after implementation and before adding final tests.
disable-model-invocation: true
---

# Feature behavior and test mapping

## Required input

- Approved `01-spec.md` and `02-implementation-plan.md`
- `03-implementation-report.md`
- Current implementation and existing tests

## Instructions

1. Inspect the implementation rather than trusting the report alone.
2. Inventory success, validation, loading, empty, error, authorization, privacy, concurrency, provider, migration, rollback, responsive, and accessibility behavior.
3. Create `04-test-map.md` from the template.
4. Trace every `REQ-*`, `AC-*`, and `RISK-*`.
5. Assign the lowest reliable test level:
   - unit for pure rules and transformations;
   - API for validation, authorization, and response contracts;
   - component for interactive UI state that Vitest can exercise;
   - E2E for critical user journeys and responsive integration;
   - integration/manual gates for real provider or migration behavior.
6. Identify misleading, missing, duplicate, or implementation-coupled tests.
7. Define mutation scope for changed business logic and route handlers.
8. Complete the handoff and stop. Do not add tests or change production code.

## Quality gate

- No requirement, acceptance criterion, or risk lacks a mapped behavior.
- Every missing test names the failure it must detect.
- Exclusions and manual checks have explicit reasons.

## Output

Only `docs/features/<feature>/04-test-map.md`, with `Next skill: feature-test`.
