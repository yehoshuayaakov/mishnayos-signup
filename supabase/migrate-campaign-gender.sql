-- Additive: grammatical gender for memorial copy (footer and later phrases).
-- Existing campaigns stay masculine. Rivkah Silver is feminine.
-- Safe to re-run. Do not run schema.sql against a database with signups.

alter table public.campaigns
  add column if not exists gender text not null default 'masculine';

alter table public.campaigns
  drop constraint if exists campaigns_gender_check;

alter table public.campaigns
  add constraint campaigns_gender_check
  check (gender in ('masculine', 'feminine'));

update public.campaigns
set gender = 'feminine'
where slug = 'rivkah-silver'
  and gender is distinct from 'feminine';
