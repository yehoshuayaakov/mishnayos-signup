-- Add claimant capabilities and organizer campaign membership.
-- Additive live migration. Apply after migrate-reminders.sql and before deploying
-- the claimant/organizer access application code.

alter table public.tractates
  add column if not exists claim_edit_token_hash text;

create table if not exists public.campaign_memberships (
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id bigint not null references public.campaigns(id) on delete cascade,
  role text not null default 'organizer' check (role in ('organizer')),
  created_at timestamptz not null default now(),
  primary key (user_id, campaign_id)
);

create index if not exists campaign_memberships_campaign_idx
  on public.campaign_memberships (campaign_id);

alter table public.campaign_memberships enable row level security;
revoke all on table public.campaign_memberships from public, anon, authenticated;
grant all on table public.campaign_memberships to service_role;
grant all on table public.campaign_memberships to postgres;

-- Replace the claim function with a backward-compatible final argument.
drop function if exists public.claim_tractate(
  bigint, bigint, text, boolean, text, text, text, boolean, boolean, text, text
);

create or replace function public.claim_tractate(
  p_tractate_id bigint,
  p_campaign_id bigint,
  p_name text,
  p_want_reminder boolean,
  p_email text,
  p_phone_e164 text,
  p_cadence text,
  p_send_email boolean,
  p_send_voice boolean,
  p_locale text,
  p_manage_token text,
  p_claim_edit_token_hash text default null
) returns text
language plpgsql
as $$
declare
  updated_id bigint;
begin
  update public.tractates
  set claimed_by = p_name,
      claimed_at = now(),
      claim_edit_token_hash = p_claim_edit_token_hash
  where id = p_tractate_id
    and campaign_id = p_campaign_id
    and claimed_by is null
  returning id into updated_id;

  if updated_id is null then
    return 'already_claimed';
  end if;

  if p_want_reminder then
    insert into public.reminders (
      tractate_id, campaign_id, email, phone_e164, cadence,
      send_email, send_voice, locale, manage_token
    ) values (
      p_tractate_id, p_campaign_id, p_email, p_phone_e164, p_cadence,
      coalesce(p_send_email, false), coalesce(p_send_voice, false),
      coalesce(p_locale, 'he'), p_manage_token
    );
  end if;

  return 'ok';
end;
$$;

revoke all on function public.claim_tractate(
  bigint, bigint, text, boolean, text, text, text, boolean, boolean, text, text, text
) from public, anon, authenticated;
grant execute on function public.claim_tractate(
  bigint, bigint, text, boolean, text, text, text, boolean, boolean, text, text, text
) to service_role, postgres;

create or replace function public.edit_claim_with_capability(
  p_tractate_id bigint,
  p_campaign_id bigint,
  p_token_hash text,
  p_action text,
  p_name text default null
) returns text
language plpgsql
as $$
declare
  current_id bigint;
begin
  select id into current_id
  from public.tractates
  where id = p_tractate_id
    and campaign_id = p_campaign_id
    and claimed_by is not null
    and claim_edit_token_hash = p_token_hash
    and claimed_at >= now() - interval '15 minutes'
  for update;

  if current_id is null then
    return 'forbidden';
  end if;

  if p_action = 'rename' and nullif(btrim(p_name), '') is not null then
    update public.tractates
    set claimed_by = btrim(p_name)
    where id = current_id;
    return 'ok';
  end if;

  if p_action = 'release' then
    delete from public.reminders where tractate_id = current_id;
    update public.tractates
    set claimed_by = null,
        claimed_at = null,
        claim_edit_token_hash = null
    where id = current_id;
    return 'ok';
  end if;

  return 'invalid_input';
end;
$$;

revoke all on function public.edit_claim_with_capability(bigint, bigint, text, text, text)
  from public, anon, authenticated;
grant execute on function public.edit_claim_with_capability(bigint, bigint, text, text, text)
  to service_role, postgres;

create or replace function public.release_tractate(
  p_tractate_id bigint,
  p_campaign_id bigint
) returns text
language plpgsql
as $$
declare
  current_id bigint;
begin
  select id into current_id
  from public.tractates
  where id = p_tractate_id
    and campaign_id = p_campaign_id
    and claimed_by is not null
  for update;

  if current_id is null then
    return 'not_claimed';
  end if;

  delete from public.reminders where tractate_id = current_id;
  update public.tractates
  set claimed_by = null,
      claimed_at = null,
      claim_edit_token_hash = null
  where id = current_id;
  return 'ok';
end;
$$;

revoke all on function public.release_tractate(bigint, bigint)
  from public, anon, authenticated;
grant execute on function public.release_tractate(bigint, bigint)
  to service_role, postgres;
