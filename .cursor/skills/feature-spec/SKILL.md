---
name: feature-spec
description: Creates a reviewable feature specification with stable requirements, acceptance criteria, risks, and initial test behaviors. Use when starting a new feature before implementation planning.
disable-model-invocation: true
---

# Feature specification

## Required input

- Feature name and user intent
- Existing discussion, constraints, and related documentation
- `AGENTS.md`
- `docs/engineering/feature-workflow.md`

## Instructions

1. Create `docs/features/<feature>/01-spec.md` from `docs/features/_template/01-spec.md`.
2. Investigate existing behavior only enough to distinguish current state from desired outcomes.
3. Describe the problem and observable behavior without choosing implementation details.
4. Define actors and authorization boundaries.
5. Assign stable `REQ-*`, `AC-*`, and `RISK-*` identifiers.
6. Include loading, empty, success, validation, failure, concurrency, mobile, accessibility, privacy, migration, rollout, and out-of-scope behavior where relevant.
7. List initial test behaviors derived from acceptance criteria.
8. Resolve material ambiguity with the user; do not leave implementation-changing decisions for the next stage.
9. Complete the handoff and stop. Do not create a plan or edit application code.

## Quality gate

- Every requirement has at least one acceptance criterion.
- Acceptance criteria are externally testable.
- Risks name required controls, not generic concerns.
- Scope exclusions prevent adjacent feature creep.
- `Open decisions` is `None` before handoff.

## Output

Only `docs/features/<feature>/01-spec.md`, with `Next skill: feature-plan`.
