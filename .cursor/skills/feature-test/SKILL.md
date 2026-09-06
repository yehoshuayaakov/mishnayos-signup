---
name: feature-test
description: Implements the approved behavior test map, runs deterministic suites, and records risk-focused test evidence and accepted gaps. Use after feature-test-map.
disable-model-invocation: true
---

# Feature tests

## Required input

- Approved `04-test-map.md`
- Upstream feature artifacts
- Current implementation and test conventions

## Instructions

1. Refuse to proceed if the test map leaves identifiers or material behaviors unmapped.
2. Add or improve tests in gap order, naming the risk each guards.
3. Test public contracts and outcomes, not private implementation details.
4. Cover negative paths and boundary values before adding redundant happy paths.
5. Mock Resend/Twilio in CI and never use live provider credentials.
6. Include 320px/375px and desktop behavior for changed UI.
7. Run focused tests first, then all relevant Vitest and Playwright suites.
8. Fix production defects revealed by tests only when they are within approved behavior; record the correction as a deviation.
9. Create `05-test-report.md` from the template with commands and results.
10. Complete the handoff and stop. Do not perform mutation analysis.

## Quality gate

- All mapped automated tests pass.
- Manual/integration gaps are explicit and justified.
- The report lists exact mutation-ready source modules.

## Output

Tests, approved in-scope fixes, and `docs/features/<feature>/05-test-report.md`, with `Next skill: feature-mutation`.
