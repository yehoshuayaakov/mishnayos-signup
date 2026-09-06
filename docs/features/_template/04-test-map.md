# Behavior and test map: <feature name>

## Inputs reconciled

- Specification: `01-spec.md`
- Plan: `02-implementation-plan.md`
- Implementation report: `03-implementation-report.md`

## Behavior inventory

List every observable success, validation, failure, authorization, concurrency, responsive, accessibility, migration, and rollback behavior.

## Traceability map

- `REQ-FEATURE-001`
  - `AC-FEATURE-001`
  - `RISK-FEATURE-001`
  - Behavior:
  - Test level:
  - Test file/name:
  - Status: existing | missing | inadequate

## Boundary analysis

- Client validation:
- API validation:
- Authorization:
- Database integrity:
- Provider failure:
- Concurrency:
- Mobile/accessibility:

## Test gaps

List missing or inadequate tests in implementation order. Every gap identifies the risk it guards.

## Mutation scope

List testable changed modules to mutate and exclusions with reasons.

## Handoff

- Status: ready-for-review
- Inputs: approved upstream artifacts and current implementation
- Outputs: `04-test-map.md`
- Open decisions: none
- Deviations: none
- Next skill: `feature-test`
