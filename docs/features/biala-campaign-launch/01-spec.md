# Feature specification: Biala Ostrova campaign launch

## Problem

A new public campaign must be launched immediately without payments or learner reminders. The current claim form always offers email reminders, so merely omitting provider credentials would advertise a service that has not completed live-provider verification. Campaign creation is operator-managed and may use the existing SQL workflow.

## Users and permissions

- **Learner:** may view the campaign, claim an open tractate, and use the existing private 15-minute rename/release capability. The learner must not see or submit reminder options for this campaign.
- **Campaign organizer:** shares the campaign and handles corrections after the claimant window through the operator.
- **System operator:** creates and manages the campaign through Supabase, controls whether reminders are available, and may change campaign content or the support address.
- **Visitor:** may view public claimant display names and the explicitly approved public support email; receives no database or administrative access.

## Scope

### In scope

- `REQ-BIALA-001`: Campaigns have an explicit reminder-availability state that is disabled by default.
- `REQ-BIALA-002`: A disabled campaign shows no reminder switch, reminder fields, reminder promises, or reminder-management link during claiming.
- `REQ-BIALA-003`: The claim API rejects crafted reminder enrollment for a disabled campaign and stores no reminder row.
- `REQ-BIALA-004`: The reminder job does not send reminders for a campaign while reminder availability is disabled.
- `REQ-BIALA-005`: Launch the campaign at `/biala-ostrova-rebbe` with the supplied Hebrew content, navy theme, supplied memorial photo, and no payments or reminders.
- `REQ-BIALA-006`: Make `/` redirect to `/biala-ostrova-rebbe` through the deployment’s default-campaign configuration.
- `REQ-BIALA-007`: Publish `yehoshuayaakov@gmail.com` as the temporary learner correction/support contact and allow it to be replaced without changing the campaign URL.
- `REQ-BIALA-008`: Keep campaign administration operator-managed through Supabase for this release; organizer login is not a launch dependency.

### Out of scope

- Enabling or live-testing Resend, sending confirmation/reminder emails, voice/SMS/WhatsApp, payment, public campaign creation, organizer self-service, a support form, direct image upload, multiple learners per tractate, printable export, and multilingual UI changes.
- Removing reminder infrastructure used by future campaigns.
- Redesigning the public board or claim modal.

## Requirements

- Disabled reminder availability must be enforced in both presentation and server behavior; a UI-only hide is insufficient.
- Existing campaigns and newly created campaigns remain disabled unless an operator explicitly enables them after reminder verification.
- Disabling a campaign must also prevent its existing reminder records, if any, from being sent until re-enabled.
- Normal claiming, duplicate-claim protection, claimant capability editing, public PII exclusion, mobile behavior, and organizer authorization boundaries must remain unchanged.
- The support email is public campaign content and was explicitly supplied for temporary publication.

## Acceptance criteria

- `AC-BIALA-001` for `REQ-BIALA-001`: Given a newly created or migrated campaign with no explicit enablement, its reminder availability is disabled.
- `AC-BIALA-002` for `REQ-BIALA-002`: Given the Biala campaign claim dialog, no reminder control or reminder-related copy is present at desktop, 375px, or 320px widths.
- `AC-BIALA-003` for `REQ-BIALA-003`: Given a direct claim request containing reminder fields for the Biala campaign, the API returns a clear 400 response and neither claim nor reminder is created.
- `AC-BIALA-004` for `REQ-BIALA-004`: Given a stored reminder associated with a disabled campaign, a reminder-job run records it as skipped and calls no provider.
- `AC-BIALA-005` for `REQ-BIALA-005`: The public campaign loads at `/biala-ostrova-rebbe` and displays:
  - title: `חלוקת משניות`;
  - memorial name: `כ"ק האדמו"ר מביאלא אוסטרובא רבי אברהם ירחמיאל בן הרה"ק דוד מתתיהו זצ"ל`;
  - subtitle: `נלב"ע ח"י אלול תשפ"ו`;
  - displayed deadline: `נא לסיים עד י"ט תשרי תשפ"ז`;
  - real deadline: September 30, 2026 at 23:59:59 in `Asia/Jerusalem`;
  - navy theme and the supplied memorial photo.
- `AC-BIALA-006` for `REQ-BIALA-006`: Visiting `/` redirects to `/biala-ostrova-rebbe` in the release environment.
- `AC-BIALA-007` for `REQ-BIALA-007`: The public campaign includes the temporary support email in correction instructions, while public APIs continue to exclude reminder contact data.
- `AC-BIALA-008` for `REQ-BIALA-008`: The campaign can be created, corrected, and released through operator Supabase access without configuring organizer Auth.
- `AC-BIALA-009` for `REQ-BIALA-005`: A learner can claim an open tractate, receives duplicate-claim conflict behavior, and can rename or release during the existing 15-minute window.

## States and edge cases

- Loading: existing board loading behavior remains unchanged.
- Empty: a fully open campaign displays all seeded tractates and zero progress.
- Success: claim confirmation mentions only the tractate claim, not reminders.
- Validation: crafted reminder input fails before the claim transaction.
- Failure: missing campaign data or photo falls back according to existing board behavior; reminder disablement fails closed.
- Concurrency: reminder availability cannot weaken atomic duplicate-claim handling.
- Mobile and accessibility: claim controls remain keyboard-operable, retain 44px phone targets, and have no horizontal overflow at 320px/375px.

## Security and privacy

- `RISK-BIALA-001`: Hiding reminders only in the UI could permit crafted enrollment. Require API rejection before claiming.
- `RISK-BIALA-002`: Stored rows could still trigger unverified provider sends. Require the reminder job to skip disabled campaigns.
- `RISK-BIALA-003`: A migration default could accidentally enable reminders elsewhere. Default and backfill all campaigns to disabled; require explicit future enablement.
- `RISK-BIALA-004`: The temporary personal email may attract spam because it is public. Display only the explicitly approved address and keep it replaceable as campaign content.
- `RISK-BIALA-005`: An incorrect Hebrew/Gregorian deadline conversion could misstate completion timing. Store September 30, 2026 end-of-day in `Asia/Jerusalem` and retain the supplied Hebrew display text.
- `RISK-BIALA-006`: A wrong root configuration could displace or fail to expose the intended campaign. Verify both direct and root URLs after deployment.
- `RISK-BIALA-007`: A destructive or out-of-order migration could damage existing campaigns. Use additive SQL after the existing reminder and claimant-access migrations; never run `schema.sql` on live data.

## Data and migration constraints

- Reminder availability must be durable campaign configuration with a safe disabled default.
- The campaign slug is the supplied lowercase value `biala-ostrova-rebbe`; exact duplicates must continue to fail at the database uniqueness boundary.
- The supplied photo is stored as a public application asset; campaign data references its stable path.
- Live deployment uses additive migration and campaign-creation SQL only.

## Initial test behaviors

- Default/backfilled disabled state and explicit enablement.
- Disabled claim dialog at desktop, 375px, and 320px.
- Crafted reminder request rejected before claim execution.
- Disabled campaign skipped by reminder job with no provider call.
- Existing enabled-campaign reminder tests remain valid.
- Biala content, photo, direct URL, root redirect, standard claim, duplicate conflict, claimant edit/release, and public reminder-PII exclusion.
- Migration ordering and idempotent campaign slug conflict.

## Rollout and success

- Complete deterministic, responsive, and targeted mutation gates before release.
- Verify the production schema version before applying only the new additive migration.
- Create the campaign once, set `DEFAULT_CAMPAIGN=biala-ostrova-rebbe`, deploy, and run direct/root/mobile/claim/edit/release/no-reminder smoke checks.
- Success means learners can use the campaign normally while no reminder enrollment or sending path is available.

## Open decisions

- None.

## Amendment — 2026-09-06: global reminder shutdown

- `REQ-BIALA-009`: While reminders remain unverified for release, one global fail-closed control disables reminder presentation, enrollment, and provider sending across every campaign.
- `AC-BIALA-010` for `REQ-BIALA-009`: Given the production release configuration, every campaign hides reminder UI, every crafted reminder-enrollment request is rejected before claiming, and the reminder job calls no provider.
- `RISK-BIALA-008`: A campaign row could be enabled accidentally before the feature is production-ready. Require both the global release control and campaign-level availability to be enabled before any reminder behavior is available.
- This amendment clarifies that the initial shutdown is system-wide. Campaign-level configuration remains in scope so reminders can later be enabled deliberately without another data-model change.

## Amendment — 2026-09-06: defer campaign-level configuration

- `REQ-BIALA-001` and `AC-BIALA-001` are superseded for this release. No campaign-level reminder column or migration will be introduced before the reminder feature itself is launched.
- `REQ-BIALA-009` is narrowed to one global, default-off release gate. The gate still controls presentation, enrollment, and sending across the application.
- `AC-BIALA-010` remains required: production hides reminder UI, rejects crafted reminder enrollment before claiming, and calls no reminder provider.
- `RISK-BIALA-003` is controlled by a false-by-default global setting rather than a database default.
- `RISK-BIALA-008` is superseded because no campaign row can enable reminders in this release.
- Campaign-specific reminder availability is deferred to the future reminder-launch specification.

## Handoff

- Status: ready-for-review
- Inputs: supplied campaign content, photo, release choices, and existing project constraints
- Outputs: `01-spec.md`
- Open decisions: none
- Deviations: amended on 2026-09-06 to require a global reminder shutdown and defer campaign-level configuration
- Next skill: `feature-plan`
