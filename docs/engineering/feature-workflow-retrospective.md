# Feature workflow pilot retrospective

Pilot: `docs/features/claimant-organizer-access/`
Date: 2026-08-31

## Outcome

The standalone chain produced all seven durable artifacts and a final `GO`:

- Feature traceability validator passed through delivery.
- Production build/type validation passed.
- 25 Vitest files and 96 tests passed.
- All 8 Playwright journeys passed.
- 348 targeted mutants were generated and all 348 were killed.
- Architecture, ADR, README, environment, migration, and agent guidance now agree.

## Stage review

- **Specification:** stable identifiers and explicit out-of-scope items prevented claimant accounts, public signup, billing, upload, and reminder-contact tooling from entering the pilot.
- **Plan:** separating anonymous claimant capability from organizer identity made trust boundaries, migrations, and test targets clear before implementation.
- **Implementation:** the report exposed one deliberate deviation: secure-cookie behavior derives from production environment rather than a configurable weakening switch.
- **Test map:** reconciliation caught obsolete password tests and made PII, expiry, membership, atomic release, mobile, and migration behavior explicit.
- **Tests:** risk-labeled tests found a real strict-selector E2E issue and documented the live-Supabase boundary.
- **Mutation:** the highest-value stage for this pilot. Initial 35–52% route/domain scores exposed shallow status-only assertions, untested failures, and unasserted query/cookie contracts. Strengthening tests produced 100% for the targeted 348 mutants.
- **Documentation:** the architecture summary and AGENTS had stale shared-password/unenforced-window claims; the documentation gate corrected them.
- **Verification:** independent reruns confirmed the full deterministic, E2E, build, mutation, and traceability gates.

## Friction and adjustments

1. Stryker’s CLI retains only the last repeated `--mutate` value and splits comma-delimited values. Stable extglob or one command per path family is required.
2. Failed Stryker runs can leave `.stryker-tmp` sandboxes. The directory is now ignored by Git and excluded from Vitest discovery.
3. Static schema-initialization mutants can be hard to observe. Removing unnecessary schema factories produced clearer code and mutation evidence.
4. Route mutation was noisy until API tests asserted response bodies, exact query arguments, error branches, and cookie values—not only status codes.
5. The seven artifacts intentionally repeat identifiers, but prose duplication should remain limited to traceability rather than copying whole requirements.
6. Live Supabase migration/Auth/SMTP behavior cannot be safely proven in credential-free CI. It remains an explicit staging deployment gate, not an implicitly “passed” automated test.
7. A request to continue end-to-end can approve the overall chain, but an automatic orchestrator must still stop when a stage records open decisions or scope-changing deviations.

## Criteria for a future orchestrator

Do not build an aggregate orchestrator until all criteria are met:

- At least two additional features of different shapes (one UI-heavy and one data/operations-heavy) complete the standalone chain.
- Each skill is invoked and evaluated independently on those pilots; no stage needs hidden context from the previous agent.
- A machine-readable approval mechanism distinguishes `draft`, `ready-for-review`, and `approved` without silently rewriting artifacts.
- The validator supports stage-specific approval and deviation checks, not only file/heading/identifier completeness.
- Mutation targets are passed through a tested wrapper that validates globs, reports zero matched files as failure, and combines multiple target families safely.
- The orchestrator is resumable and idempotent: it detects the last valid gate and never overwrites approved history.
- Open decisions, scope/security/data deviations, failed tests, surviving meaningful mutants, missing live gates, and stale architecture produce `NO-GO` and return ownership to the correct skill.
- Human approval remains mandatory after specification and implementation plan, and for scope-changing deviations.
- Commands, outputs, durations, and artifact hashes are recorded so handoffs are reproducible.
- The aggregate runner does not commit, deploy, apply live migrations, invite users, or modify external services without separate explicit authorization.

## Recommended next workflow improvements

1. Add approval metadata only after observing two more manual pilots.
2. Add a small mutation-target wrapper before the next feature with more than one source family.
3. Establish the scheduled repository-wide mutation baseline before setting `thresholds.break`.
4. Add staging-only migration/Auth smoke automation when a disposable Supabase project is available.
5. Revisit an orchestrator only when the criteria above are satisfied; manual invocation remains the default now.
