# ADR 0001: separate claimant capabilities from organizer identity

- Status: accepted
- Date: 2026-08-31
- Related feature: `docs/features/claimant-organizer-access/`
- Requirements: `REQ-ACCESS-001` through `REQ-ACCESS-008`

## Context

Learners must remain accountless, but the person who just claimed a tractate needs a short opportunity to fix or release it. Organizers need durable, campaign-scoped administration. A shared password cannot identify either actor and would give every holder access to every campaign.

## Decision

- A successful claim creates a random 256-bit capability. The browser receives it in a 15-minute HttpOnly, SameSite cookie; Postgres stores only a SHA-256 hash.
- Public state returns edit permission only when the request capability matches. Postgres revalidates the hash and `claimed_at` inside the rename/release transaction.
- Organizers use invite-only Supabase Auth magic links with `shouldCreateUser: false`.
- `campaign_memberships` grants an authenticated organizer access to an explicit campaign.
- Server code validates the Auth user and membership before using the service role for admin data.
- Claimant capabilities and organizer sessions are intentionally non-interchangeable.

## Alternatives considered

- **Shared admin password:** rejected because it is not an identity, cannot isolate campaigns, is exposed through public UI, and has poor revocation/audit properties.
- **Claimant accounts:** rejected because learners are intentionally anonymous and signup friction would reduce participation.
- **Readable edit token in client storage/database:** rejected because JavaScript access and plaintext-at-rest increase token theft impact.
- **Signed stateless claimant token:** not selected because capability revocation on release/reclaim and direct database enforcement are simpler with a stored hash.
- **Public organizer signup:** deferred until invitations, roles, abuse controls, account recovery, and billing are specified.

## Consequences

- Supabase Auth redirect URLs, SMTP, invited users, and membership rows are deployment prerequisites.
- Existing claims created before migration cannot be edited by claimants.
- Organizer pages may use service-role queries only after centralized authorization.
- Release is atomic with reminder deletion.
- Self-service invitations, role changes, campaign creation, and image upload require later features.
