---
name: feature-document
description: Updates durable feature, architecture, operational, and user documentation after implementation and quality evidence are complete. Use after feature-mutation.
disable-model-invocation: true
---

# Feature documentation

## Required input

- `01-spec.md` through `06-mutation-report.md`
- Current implementation
- `docs/architecture/overview.md`, README, AGENTS, and relevant runbooks

## Instructions

1. Verify tests and mutation analysis are complete before documenting delivery.
2. Update `docs/architecture/overview.md` when runtime, data, security, provider, or operational behavior changed.
3. Create or supersede an ADR for material architectural decisions; never rewrite accepted history.
4. Update README/user instructions, environment examples, migrations, rollout, rollback, and operational runbooks as applicable.
5. Remove stale claims that conflict with delivered behavior.
6. Create `07-delivery-summary.md` from the template.
7. Trace every `REQ-*`, `AC-*`, and `RISK-*` to delivered, tested, documented evidence or an approved exception.
8. Keep future work separate from current completion.
9. Complete the handoff and stop. Do not declare final go/no-go.

## Quality gate

- Repository documentation describes current behavior consistently.
- Deployment operators have exact migration, environment, smoke, monitoring, and rollback instructions.
- Architecture and feature catalog link the delivery record.

## Output

Documentation updates plus `docs/features/<feature>/07-delivery-summary.md`, with `Next skill: feature-verify`.
