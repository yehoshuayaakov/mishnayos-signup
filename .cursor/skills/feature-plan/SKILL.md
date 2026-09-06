---
name: feature-plan
description: Converts an approved feature specification into a codebase-specific implementation, security, migration, test, rollout, and rollback plan. Use after feature-spec and before code changes.
disable-model-invocation: true
---

# Feature implementation plan

## Required input

- Approved `docs/features/<feature>/01-spec.md`
- `AGENTS.md`
- `docs/engineering/feature-workflow.md`
- Current codebase and architecture overview

## Instructions

1. Refuse to proceed when the specification has open decisions or untestable acceptance criteria.
2. Explore all affected layers. Use parallel read-only exploration for independent frontend, backend, data, security, and testing concerns.
3. Create `02-implementation-plan.md` from the template.
4. Reference every `REQ-*` and `AC-*`.
5. Choose one implementation approach and record meaningful rejected alternatives.
6. For UI, identify DS primitives before feature composites and responsive/accessibility behavior.
7. For data, use additive migrations, define integrity constraints, deployment order, compatibility, and rollback.
8. Map every `RISK-*` to a concrete control and planned test.
9. Name exact files to add, modify, or remove and an ordered implementation sequence.
10. Complete the handoff and stop. Do not edit code, dependencies, or configuration.

## Quality gate

- No unresolved architecture or product decisions.
- Security, privacy, failure, concurrency, observability, rollout, and rollback are explicit.
- Test levels are planned but test implementations are not invented prematurely.

## Output

Only `docs/features/<feature>/02-implementation-plan.md`, with `Next skill: feature-implement`.
