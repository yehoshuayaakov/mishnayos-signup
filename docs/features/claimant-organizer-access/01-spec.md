# Feature specification: claimant editing and organizer administration

## Problem

The public board currently displays an edit button to every visitor and then asks for one shared admin password. This does not identify the claimant, does not enforce the promised 15-minute window, and cannot isolate organizers when the product hosts unrelated campaigns.

## Users and permissions

- **Claimant:** remains accountless; may rename or release only the claim created by the same browser for 15 minutes after claiming.
- **Visitor:** may view the public board and claim an open tractate; may not see claimant edit controls for another browser.
- **Organizer:** authenticates through an invite-only email magic link; may administer only campaigns where they have membership.
- **System operator:** initially invites organizers and assigns campaign membership through Supabase administration/SQL.

## Scope

### In scope

- `REQ-ACCESS-001`: Issue a private, short-lived claimant capability after a successful claim.
- `REQ-ACCESS-002`: Show claimant edit controls only to the browser holding a valid capability and only until 15 minutes after the claim.
- `REQ-ACCESS-003`: Permit the authorized claimant to rename or release the claim; release must atomically delete its reminder.
- `REQ-ACCESS-004`: Replace shared-password administration with invite-only Supabase magic-link sessions.
- `REQ-ACCESS-005`: Enforce campaign membership on every organizer page and mutation.
- `REQ-ACCESS-006`: Provide a separate admin interface to edit campaign title, memorial name, subtitle, instructions, photo URL, theme, and display deadline.
- `REQ-ACCESS-007`: Let organizers view all campaign tractates and rename or release a claimant.
- `REQ-ACCESS-008`: Remove the shared admin password and public admin-edit behavior without exposing reminder contact data.
- `REQ-ACCESS-009`: Keep claimant and organizer interfaces accessible, responsive, Hebrew-first, and usable at 320px/375px and desktop widths.

### Out of scope

- Public organizer registration, invitations from the application, role management UI, MFA, billing, Stripe, binary image upload, reminder-contact support tools, and claimant accounts.
- Editing reminder preferences from the admin interface.
- Changing reminder scheduling or provider behavior.

## Requirements

- Claimant authorization uses a random token delivered only in an `HttpOnly`, `Secure` production, `SameSite=Lax` cookie. Only a hash is stored.
- The server validates capability hash, campaign, tractate, current claim state, and `claimed_at` on every claimant mutation.
- Client-side visibility is advisory; expiration and authorization are enforced transactionally in Postgres.
- Magic-link login must not create arbitrary users; only pre-invited Supabase Auth users may request links.
- Organizer authorization verifies the current Supabase user and a `(user_id, campaign_id)` membership before service-role data access.
- Admin responses and pages never select reminder email, phone, or management tokens.

## Acceptance criteria

- `AC-ACCESS-001` for `REQ-ACCESS-001`: Given a successful claim, when the response completes, then the browser receives a 15-minute HttpOnly capability cookie and the database stores only its hash.
- `AC-ACCESS-002` for `REQ-ACCESS-002`: Given two browsers viewing the same claimed tractate, then only the claiming browser sees edit controls, and those controls disappear after expiry.
- `AC-ACCESS-003` for `REQ-ACCESS-003`: Given a valid unexpired capability, rename changes only the display name without extending the window; release clears the claim and reminder in one transaction.
- `AC-ACCESS-004` for `REQ-ACCESS-003`: Given a missing, wrong, expired, or superseded capability, claimant rename/release returns 403 and changes nothing.
- `AC-ACCESS-005` for `REQ-ACCESS-004`: Given an invited organizer email, magic-link authentication creates a secure session; an unknown email is not auto-created.
- `AC-ACCESS-006` for `REQ-ACCESS-005`: Given an authenticated organizer, campaign pages and APIs allow only campaigns present in their memberships.
- `AC-ACCESS-007` for `REQ-ACCESS-006`: Given an authorized organizer, valid campaign content changes appear on the public board; invalid values show field errors.
- `AC-ACCESS-008` for `REQ-ACCESS-007`: Given an authorized organizer, the tractate list shows claimant display names and permits rename/release without showing reminder contacts.
- `AC-ACCESS-009` for `REQ-ACCESS-008`: The public board no longer displays edit controls based on a global password, and `ADMIN_PASSWORD` is not required by the new routes.
- `AC-ACCESS-010` for `REQ-ACCESS-009`: Critical claimant/admin flows have labeled controls, keyboard operation, reachable actions, no horizontal overflow, and phone-width coverage.

## States and edge cases

- Loading: admin routes show a bounded loading/navigation state while sessions or mutations resolve.
- Empty: organizers with no campaign memberships see a clear no-access state.
- Success: claimant and organizer updates refresh visible campaign state.
- Validation: names are non-empty strings up to 60 characters; campaign fields use shared Zod schemas.
- Failure: invalid/expired capabilities and missing memberships fail closed without revealing whether unrelated records exist.
- Concurrency: re-claiming a released tractate replaces the old capability; overlapping release is idempotent from the user perspective.
- Mobile and accessibility: admin forms stack at phone widths; claimant controls retain 44px touch targets.

## Security and privacy

- `RISK-ACCESS-001`: Token leakage could let another user edit a claim. Mitigate with random tokens, hash-at-rest, HttpOnly cookies, short expiry, and server checks.
- `RISK-ACCESS-002`: UI-only timing could allow late edits. Enforce the 15-minute window in the database RPC.
- `RISK-ACCESS-003`: Service-role access could cross tenant boundaries. Centralize session plus membership authorization before every admin query.
- `RISK-ACCESS-004`: Magic-link login could create unauthorized organizers. Use `shouldCreateUser: false` and require membership.
- `RISK-ACCESS-005`: Non-transactional release could leave orphan reminders. Use one release RPC for claim and reminder deletion.
- `RISK-ACCESS-006`: Admin APIs could expose reminder PII. Select only campaign and tractate fields.
- `RISK-ACCESS-007`: Stolen sessions could mutate campaigns. Use secure Supabase cookies, server-side `getUser`, and logout.
- `RISK-ACCESS-008`: Unsafe photo/content values could create injection or tracking issues. Validate lengths, theme values, and HTTPS image URLs; rely on React escaping.

## Data and migration constraints

- Add claimant token hash to `tractates`.
- Add `campaign_memberships` linked to `auth.users` and campaigns.
- Add atomic claimant-edit and organizer-release RPCs with service-role/postgres grants only.
- Use a new additive migration. Never rerun the destructive schema on live data.
- Existing claims receive no claimant capability and remain organizer-editable only.

## Initial test behaviors

- Claim cookie attributes, token hashing, own-browser visibility, expiry boundary, rename without timestamp extension, atomic release, stale token denial.
- Magic-link request for invited versus unknown users, callback session exchange, unauthenticated redirect, membership allow/deny.
- Campaign field validation and successful updates.
- Admin tractate rename/release and PII exclusion.
- Public removal of password prompt/edit controls for non-claimants.
- Phone-width claimant and admin flows.

## Rollout and success

- Deploy additive migration before application code.
- Keep the legacy password route only during a short compatibility window if required, then remove it.
- Success means unrelated visitors cannot see claimant edit controls, expired tokens cannot mutate, organizers cannot access other campaigns, and release cannot orphan reminders.

## Open decisions

- None.

## Handoff

- Status: ready-for-review
- Inputs: approved feature-delivery workflow and prior admin-access discussion
- Outputs: `01-spec.md`
- Open decisions: none
- Deviations: none
- Next skill: `feature-plan`
