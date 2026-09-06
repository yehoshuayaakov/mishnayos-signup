# Feature delivery workflow

Every user-facing feature, security change, data-model change, or externally observable behavior follows this workflow. Small maintenance changes may use a shortened specification, but they may not skip validation, tests, or documentation for behavior they alter.

## Stage contract

1. **Specification** — define the problem, users, scope, constraints, requirements, acceptance criteria, risks, and initial test behaviors in `01-spec.md`.
2. **Implementation plan** — map the approved specification to architecture, files, data, security, rollout, and planned test levels in `02-implementation-plan.md`.
3. **Implementation** — implement approved scope only and record changed files, verification, and deviations in `03-implementation-report.md`.
4. **Test map** — reconcile the finished behavior against every `REQ-*`, `AC-*`, and `RISK-*` in `04-test-map.md`.
5. **Tests** — fill mapped gaps, run the relevant suites, and record evidence in `05-test-report.md`.
6. **Mutation analysis** — mutate changed business logic and API handlers, resolve meaningful survivors, and record results in `06-mutation-report.md`.
7. **Documentation** — update user/developer docs, architecture, and ADRs; summarize delivery in `07-delivery-summary.md`.
8. **Final verification** — validate traceability and rerun required checks. The feature ships only on a `go` result.

## Artifact location and naming

Create one directory per feature:

```text
docs/features/<kebab-case-feature>/
  01-spec.md
  02-implementation-plan.md
  03-implementation-report.md
  04-test-map.md
  05-test-report.md
  06-mutation-report.md
  07-delivery-summary.md
```

Start from `docs/features/_template/`. Approved artifacts are historical records: add a dated amendment when requirements change instead of silently rewriting the original decision.

## Traceability

- Requirements: `REQ-<FEATURE>-NNN`
- Acceptance criteria: `AC-<FEATURE>-NNN`
- Risks: `RISK-<FEATURE>-NNN`
- Tests use the relevant identifiers in their names, comments, or test-map entry.
- Plans reference every requirement and acceptance criterion.
- The final test map references every requirement, acceptance criterion, and risk.
- Scope added during implementation requires an explicit deviation and either a specification amendment or removal.

## Approval and handoff

Each artifact ends with:

```markdown
## Handoff

- Status: ready-for-review
- Inputs: ...
- Outputs: ...
- Open decisions: none
- Deviations: none
- Next skill: feature-...
```

A stage stops when its artifact is ready. The next manually invoked skill treats invocation as approval of the prior artifact only when the user explicitly approved it or asked to continue the accepted end-to-end plan. Open decisions block handoff.

## Quality gates

- Follow `AGENTS.md` for security, data, design-system, responsive, and migration rules.
- UI specifications include mobile behavior, accessibility, loading, empty, error, and success states.
- Data changes use additive migrations and include rollout and rollback verification.
- Tests name the risk they guard and cover boundary, failure, authorization, and concurrency behavior where relevant.
- Targeted mutation testing is required for changed testable TypeScript business logic and route handlers.
- Surviving non-equivalent mutants require a new test or implementation correction.
- Generated mutation reports are CI artifacts and are not committed.

## Exceptions

Emergency production hotfixes may implement first only when delaying would increase active harm. They still require a retrospective feature directory with specification, plan, tests, mutation analysis where applicable, and documentation before the hotfix is considered closed.

Generated files, dependency-only updates, and prose-only changes do not require mutation testing. Record `not-applicable` with a reason in the mutation report; do not omit the artifact.

## Skill sequence

Invoke these project skills manually while the workflow is being evaluated:

1. `feature-spec`
2. `feature-plan`
3. `feature-implement`
4. `feature-test-map`
5. `feature-test`
6. `feature-mutation`
7. `feature-document`
8. `feature-verify`

Do not aggregate them into an automatic workflow until the pilot retrospective confirms that each stage produces useful, non-duplicative handoffs.

The first pilot findings and explicit prerequisites for an aggregate orchestrator are recorded in `docs/engineering/feature-workflow-retrospective.md`. Manual invocation remains required.
