# Delivery summary: claimant editing and organizer administration

## Delivered outcome

Claimants remain accountless but now receive a private, server-enforced 15-minute ability to correct or release their own claim. The public shared-password workflow is gone. Invited organizers authenticate through Supabase magic links and use a separate, campaign-scoped interface to edit campaign presentation and manage claimant names without seeing reminder contacts.

## Traceability

- `REQ-ACCESS-001` / `AC-ACCESS-001` / `RISK-ACCESS-001`: 256-bit capability, hash-at-rest, success-only HttpOnly cookie, and unit/API/mutation evidence.
- `REQ-ACCESS-002` / `AC-ACCESS-002` / `RISK-ACCESS-002`: own-browser state projection, client expiry, database expiry, and API/E2E/mutation evidence.
- `REQ-ACCESS-003` / `AC-ACCESS-003` / `AC-ACCESS-004` / `RISK-ACCESS-005`: rename without extending time, atomic release/reminder deletion, denial behavior, migration/API/mutation evidence.
- `REQ-ACCESS-004` / `AC-ACCESS-005` / `RISK-ACCESS-004` / `RISK-ACCESS-007`: no-create magic-link login, callback confinement, verified session, and API/unit evidence.
- `REQ-ACCESS-005` / `AC-ACCESS-006` / `RISK-ACCESS-003`: centralized user+membership checks, campaign filters, and unit/API/mutation evidence.
- `REQ-ACCESS-006` / `AC-ACCESS-007` / `RISK-ACCESS-008`: allow-listed campaign content validation, DS form, API/E2E/mutation evidence.
- `REQ-ACCESS-007` / `AC-ACCESS-008` / `RISK-ACCESS-006`: campaign-scoped tractate management, PII-safe selects/responses, API/E2E/migration evidence.
- `REQ-ACCESS-008` / `AC-ACCESS-009`: shared password production code/environment/UI/tests removed and architecture updated.
- `REQ-ACCESS-009` / `AC-ACCESS-010`: RAC DS controls, 44px phone actions, stacked layouts, claimant 320/375px and organizer 320px Playwright evidence.

## Documentation updated

- Architecture overview: current claimant and organizer boundaries, flows, data, feature catalog, and priorities.
- README/user documentation: migration order, environment, claimant behavior, organizer setup, admin use, tests.
- AGENTS/rules: capability enforcement, organizer membership, DS components, migration order, and remaining out-of-scope work.
- ADRs: `docs/architecture/decisions/0001-organizer-and-claimant-access.md`.
- Operations/runbooks: deployment and organizer bootstrap steps are in README and below.

## Deployment and rollback

1. Back up live data.
2. Apply `supabase/migrate-claimant-organizer-access.sql` after `migrate-reminders.sql`.
3. Set `NEXT_PUBLIC_SUPABASE_ANON_KEY`; retain server-only `SUPABASE_SERVICE_ROLE_KEY`.
4. Configure Supabase production SMTP and allow `/auth/callback` for the deployed origin.
5. Invite organizer Auth users and insert campaign membership rows.
6. Deploy the application and smoke: claim/correct/release, unknown-browser denial, invited login, non-member denial, campaign save, organizer release, and reminder deletion.
7. Monitor claim/edit/admin 4xx/5xx rates and Supabase Auth delivery.

Rollback the application to the prior build if needed. The additive column/table/functions may remain. Because old application code does not understand organizer Auth, do not treat rollback as a security substitute for removing compromised memberships/sessions.

## Quality evidence

- Deterministic tests: 25 Vitest files and 96 tests passed; production build/type validation passed.
- E2E/responsive: all 8 Playwright tests passed, including claimant ownership, 320px/375px modal behavior, and 320px organizer administration.
- Mutation analysis: 348 targeted mutants generated, 348 killed, no survivor/no-coverage/timeout/error.
- Workflow validation: final verification runs the complete feature validator.

## Follow-up work

- Organizer invitation/role UI, campaign creation, binary photo upload, deadline/timezone editing, account recovery, audit history, rate limiting, and observability are separately scoped future features.
- A staging Supabase smoke is a deployment gate because CI intentionally does not hold live provider credentials.

## Handoff

- Status: ready-for-review
- Inputs: all approved feature artifacts and green quality gates
- Outputs: updated documentation and `07-delivery-summary.md`
- Open decisions: none
- Deviations: production-safe cookie behavior derives from `NODE_ENV` rather than an override variable
- Next skill: `feature-verify`
