---
name: feature-implement
description: Implements an approved feature plan without expanding scope, verifies changed behavior proportionally, and records implementation evidence and deviations. Use only after feature-plan approval.
disable-model-invocation: true
---

# Feature implementation

## Required input

- Approved `01-spec.md`
- Approved `02-implementation-plan.md`
- `AGENTS.md` and referenced ADRs

## Instructions

1. Verify the plan references every specification identifier and has no open decisions.
2. Implement in the plan’s order. Add DS primitives before feature UI.
3. Preserve trust boundaries, additive migration rules, mobile behavior, and existing visual language.
4. Make only changes required by the approved plan.
5. Run type/lint checks and focused deterministic tests while implementing.
6. Do not weaken tests to make implementation pass.
7. Record every deviation immediately. Stop for approval if it changes user behavior, data, security, dependencies, rollout, or scope.
8. Create `03-implementation-report.md` from the template after the implementation is stable.
9. Complete the handoff and stop. Do not declare test coverage complete or perform mutation analysis.

## Quality gate

- Requested behavior exists and focused verification passes.
- No unapproved scope or destructive migration.
- Changed files and deployment effects are fully recorded.

## Output

Application changes plus `docs/features/<feature>/03-implementation-report.md`, with `Next skill: feature-test-map`.
