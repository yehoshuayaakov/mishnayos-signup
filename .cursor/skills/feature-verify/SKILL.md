---
name: feature-verify
description: Performs the final traceability, deterministic test, mutation, documentation, and rollout audit and returns a go or no-go result. Use only after feature-document.
disable-model-invocation: true
---

# Feature final verification

## Required input

- Complete `docs/features/<feature>/` artifact set
- Current implementation, tests, mutation report, architecture, and deployment documentation

## Instructions

1. Run `npm run workflow:validate -- docs/features/<feature> --through delivery`.
2. Independently compare specification, plan, implementation, tests, mutation report, and documentation.
3. Confirm every `REQ-*`, `AC-*`, and `RISK-*` has evidence.
4. Confirm deviations and accepted gaps have explicit approval.
5. Rerun type/lint, relevant Vitest, relevant Playwright, and targeted mutation commands.
6. Verify additive migration ordering, environment variables, feature flags, smoke tests, monitoring, and rollback steps.
7. Check `docs/architecture/overview.md` and user/operator docs for stale behavior.
8. Return:
   - `GO` only when every required gate passes;
   - `NO-GO` with blocking evidence and owning stage otherwise.
9. Do not patch blockers during verification. Hand them back to the responsible stage.

## Quality gate

- Verification is evidence-based and reproducible.
- A passing test count alone is not treated as complete traceability.
- No skipped stage, unresolved meaningful mutant, or undocumented operational change.

## Output

A final chat/reported `GO` or `NO-GO`. Do not create an additional feature artifact.
