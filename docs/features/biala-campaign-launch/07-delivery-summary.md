# Delivery summary: Biala Ostrova campaign launch

## Delivered outcome

The application is prepared to launch a new navy campaign at `/biala-ostrova-rebbe` with the supplied Hebrew memorial content and photo, a September 30, 2026 Jerusalem deadline, and the temporary public support address. Campaign creation remains an idempotent operator SQL action. The release keeps reminders globally hidden and disabled: ordinary anonymous claims still work, crafted reminder enrollment is rejected, and the scheduled job exits before database/provider work.

## Traceability

- `REQ-BIALA-001` / `AC-BIALA-001`: approved exception; campaign-level configuration was superseded and deferred before implementation.
- `REQ-BIALA-002` / `AC-BIALA-002`: delivered by server-derived availability and claim-dialog omission; tested at desktop, 320px, and 375px.
- `REQ-BIALA-003` / `AC-BIALA-003`: delivered by API rejection before service/transaction access; deterministic and mutation tested.
- `REQ-BIALA-004` / `AC-BIALA-004`: delivered by the reminder-job early return; provider/database non-interaction and mutations tested.
- `REQ-BIALA-005` / `AC-BIALA-005` / `AC-BIALA-009`: photo and exact idempotent SQL are delivered; source contract and existing claim journeys pass, with live campaign smoke pending deployment.
- `REQ-BIALA-006` / `AC-BIALA-006`: environment-driven root redirect is tested with the E2E fixture; production value/smoke are rollout gates.
- `REQ-BIALA-007` / `AC-BIALA-007`: exact approved address is tested in SQL; existing public-state privacy tests remain green.
- `REQ-BIALA-008` / `AC-BIALA-008`: SQL contains no Auth/membership operation; operator execution remains a rollout gate.
- `REQ-BIALA-009` / `AC-BIALA-010`: exact global flag/provider truth table has 100% targeted mutation coverage.
- `RISK-BIALA-001`: controlled by API non-interaction assertions.
- `RISK-BIALA-002`: controlled by job database/provider non-interaction assertions.
- `RISK-BIALA-003`: controlled by absent/empty/whitespace/non-exact configuration tests.
- `RISK-BIALA-004`: accepted public-email exposure is exact, tested, documented, and replaceable through campaign content.
- `RISK-BIALA-005`: Hebrew display and explicit Jerusalem timestamp are source tested and require live row verification.
- `RISK-BIALA-006`: root mechanism is browser tested and requires production direct/root smoke.
- `RISK-BIALA-007`: creation SQL is non-destructive/idempotent; deployment requires backup and prerequisite inspection.
- `RISK-BIALA-008`: approved exception; no campaign-level enablement exists.

## Documentation updated

- Architecture overview: reminder runtime, fail-closed gate, feature catalog, and Biala delivery link.
- README/user documentation: current disabled status, deployment environment, dormant reminder behavior, and Biala creation instruction.
- AGENTS/rules: global reminder release guard and Biala false setting.
- ADRs: none; this is a reversible operational release gate and does not change persistence, scheduling, authentication, or deployment topology.
- Operations/runbooks: this delivery summary records deployment, smoke, monitoring, and rollback actions.

## Deployment and rollback

Deployment:

1. Back up live data and inspect the current schema. Never run `supabase/schema.sql` or `migrate-theme-deadline.sql`.
2. Confirm `migrate-reminders.sql` is present. Confirm claimant capability columns/functions exist; if absent, apply `migrate-claimant-organizer-access.sql` after the reminder migration.
3. Run `supabase/create-biala-ostrova-rebbe.sql` in the Supabase SQL Editor. Verify one `biala-ostrova-rebbe` row, `is_active=true`, exact content/timestamp/photo path, and `tractate_count=64`.
4. Configure production `ENABLE_EMAIL_REMINDERS=false`, `ENABLE_VOICE_REMINDERS=false`, and `DEFAULT_CAMPAIGN=biala-ostrova-rebbe`.
5. Deploy the pushed commit that contains `/public/biala-ostrova-rebbe.jpg`.
6. Smoke direct/root URLs, content/photo, 320px/375px/desktop layout, no reminder UI, ordinary claim, duplicate conflict, 15-minute edit/release, and public-state PII exclusion. Verify no reminder row/provider activity resulted from the ordinary claim.
7. Monitor Vercel function errors and Supabase request/database errors during launch; no Resend/Twilio activity is expected.

Rollback:

1. Keep `ENABLE_EMAIL_REMINDERS=false` and `ENABLE_VOICE_REMINDERS=false`.
2. Restore the prior `DEFAULT_CAMPAIGN` and redeploy or promote the previous Vercel deployment.
3. Mark the Biala row inactive if the direct URL must also stop serving.
4. Preserve the isolated campaign/tractate rows for diagnosis; do not delete or run destructive schema SQL.

## Quality evidence

- Deterministic tests: full Vitest suite green after feature tests and mutation-strengthening.
- E2E/responsive: 9 Playwright journeys green, including hidden reminders, exact claim payload, root redirect, and 320px/375px dialog behavior.
- Mutation analysis: 105/105 mutants killed across the global gate, claim route, and changed reminder-job guard.
- Workflow validation: reserved for final verification after all artifacts are complete.

## Follow-up work

- Specify and verify the reminder feature before changing `ENABLE_EMAIL_REMINDERS` to true; the enabled reminder-job branches identified by exploratory mutation analysis require additional coverage.
- Decide whether future reminder availability is global, campaign-specific, or product-tier-specific in that separate feature.
- Replace the temporary public support email when a durable support channel is available.
- Organizer self-service, payments, multiple signups, printable exports, and multilingual UI remain separate features.

## Handoff

- Status: ready-for-review
- Inputs: all approved feature artifacts and green quality gates
- Outputs: updated documentation and `07-delivery-summary.md`
- Open decisions: none
- Deviations: campaign-level reminder configuration was superseded by approved amendment; global release gate delivered instead
- Next skill: `feature-verify`
