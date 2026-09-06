-- Adds reminder support: a real deadline timestamp, timezone, reminders tables,
-- and an atomic claim_tractate() helper. Safe to run on an existing database
-- (no data is dropped). Run in the Supabase SQL Editor.
--
-- After this, set deadline_at on existing campaigns if the backfill below
-- does not match (ט"ז אב תשפ"ו = 2026-07-30).

-- 1) Campaign columns (idempotent).
alter table campaigns add column if not exists deadline_at timestamptz;
alter table campaigns add column if not exists timezone text not null default 'Asia/Jerusalem';

-- 2) Reminder tables.
create table if not exists reminders (
  id bigint generated always as identity primary key,
  tractate_id bigint not null unique references tractates(id) on delete cascade,
  campaign_id bigint not null references campaigns(id) on delete cascade,
  email text,
  phone_e164 text,
  cadence text not null check (cadence in ('daily', 'weekly', 'week_before')),
  send_email boolean not null default false,
  send_voice boolean not null default false,
  locale text not null default 'he' check (locale in ('he', 'en')),
  unsubscribed_at timestamptz,
  manage_token text not null unique,
  created_at timestamptz not null default now(),
  check (send_email or send_voice)
);

create index if not exists reminders_campaign_idx on reminders (campaign_id);

create table if not exists reminder_sends (
  id bigint generated always as identity primary key,
  reminder_id bigint not null references reminders(id) on delete cascade,
  channel text not null check (channel in ('email', 'voice')),
  period_key text not null,
  sent_at timestamptz not null default now(),
  status text not null default 'sent' check (status in ('sent', 'failed')),
  provider_id text,
  unique (reminder_id, channel, period_key)
);

alter table public.reminders enable row level security;
alter table public.reminder_sends enable row level security;

grant all on table public.reminders to service_role;
grant all on table public.reminders to postgres;
grant all on table public.reminder_sends to service_role;
grant all on table public.reminder_sends to postgres;

-- 3) Upgrade create_campaign to accept deadline_at + timezone.
drop function if exists create_campaign(text, text, text, text, text, text);
drop function if exists create_campaign(text, text, text, text, text, text, text, text);
drop function if exists create_campaign(text, text, text, text, text, text, text, text, timestamptz, text);

create or replace function create_campaign(
  p_slug text,
  p_title text,
  p_in_memory_of text,
  p_subtitle text,
  p_instructions text,
  p_photo_url text,
  p_theme text default 'navy',
  p_deadline text default '',
  p_deadline_at timestamptz default null,
  p_timezone text default 'Asia/Jerusalem'
) returns bigint
language plpgsql
as $$
declare
  new_id bigint;
begin
  insert into campaigns (slug, title, in_memory_of, subtitle, instructions, photo_url, theme, deadline, deadline_at, timezone)
  values (p_slug, p_title, p_in_memory_of, p_subtitle, p_instructions, p_photo_url, p_theme, p_deadline, p_deadline_at, p_timezone)
  returning id into new_id;

  insert into tractates (campaign_id, seder, name, name_en, chapters, sort_order) values
    (new_id, 'זרעים', 'ברכות', 'Berachos', 9, 1),
    (new_id, 'זרעים', 'פאה', 'Peah', 8, 2),
    (new_id, 'זרעים', 'דמאי', 'Demai', 7, 3),
    (new_id, 'זרעים', 'כלאים', 'Kilayim', 9, 4),
    (new_id, 'זרעים', 'שביעית', 'Sheviis', 10, 5),
    (new_id, 'זרעים', 'תרומות', 'Terumos', 11, 6),
    (new_id, 'זרעים', 'מעשרות', 'Maasros', 5, 7),
    (new_id, 'זרעים', 'מעשר שני', 'Maaser Sheni', 5, 8),
    (new_id, 'זרעים', 'חלה', 'Challah', 4, 9),
    (new_id, 'זרעים', 'ערלה', 'Orlah', 3, 10),
    (new_id, 'זרעים', 'ביכורים', 'Bikkurim', 3, 11),
    (new_id, 'מועד', 'שבת', 'Shabbos', 24, 12),
    (new_id, 'מועד', 'עירובין', 'Eruvin', 10, 13),
    (new_id, 'מועד', 'פסחים', 'Pesachim', 10, 14),
    (new_id, 'מועד', 'שקלים', 'Shekalim', 8, 15),
    (new_id, 'מועד', 'יומא', 'Yoma', 8, 16),
    (new_id, 'מועד', 'סוכה', 'Sukkah', 5, 17),
    (new_id, 'מועד', 'ביצה', 'Beitzah', 5, 18),
    (new_id, 'מועד', 'ראש השנה', 'Rosh Hashanah', 4, 19),
    (new_id, 'מועד', 'תענית', 'Taanis', 4, 20),
    (new_id, 'מועד', 'מגילה', 'Megillah', 4, 21),
    (new_id, 'מועד', 'מועד קטן', 'Moed Katan', 3, 22),
    (new_id, 'מועד', 'חגיגה', 'Chagigah', 3, 23),
    (new_id, 'נשים', 'יבמות', 'Yevamos', 16, 24),
    (new_id, 'נשים', 'כתובות', 'Kesubos', 13, 25),
    (new_id, 'נשים', 'נדרים', 'Nedarim', 11, 26),
    (new_id, 'נשים', 'נזיר', 'Nazir', 9, 27),
    (new_id, 'נשים', 'סוטה', 'Sotah', 9, 28),
    (new_id, 'נשים', 'גיטין', 'Gittin', 9, 29),
    (new_id, 'נשים', 'קידושין', 'Kiddushin', 4, 30),
    (new_id, 'נזיקין', 'בבא קמא', 'Bava Kamma', 10, 31),
    (new_id, 'נזיקין', 'בבא מציעא', 'Bava Metzia', 10, 32),
    (new_id, 'נזיקין', 'בבא בתרא', 'Bava Basra', 10, 33),
    (new_id, 'נזיקין', 'סנהדרין', 'Sanhedrin', 11, 34),
    (new_id, 'נזיקין', 'מכות', 'Makkos', 3, 35),
    (new_id, 'נזיקין', 'שבועות', 'Shevuos', 8, 36),
    (new_id, 'נזיקין', 'עדויות', 'Eduyos', 8, 37),
    (new_id, 'נזיקין', 'עבודה זרה', 'Avodah Zarah', 5, 38),
    (new_id, 'נזיקין', 'אבות', 'Avos', 6, 39),
    (new_id, 'נזיקין', 'הוריות', 'Horayos', 3, 40),
    (new_id, 'קדשים', 'זבחים', 'Zevachim', 14, 41),
    (new_id, 'קדשים', 'מנחות', 'Menachos', 13, 42),
    (new_id, 'קדשים', 'חולין', 'Chullin', 12, 43),
    (new_id, 'קדשים', 'בכורות', 'Bechoros', 9, 44),
    (new_id, 'קדשים', 'ערכין', 'Erchin', 9, 45),
    (new_id, 'קדשים', 'תמורה', 'Temurah', 7, 46),
    (new_id, 'קדשים', 'כריתות', 'Kereisos', 6, 47),
    (new_id, 'קדשים', 'מעילה', 'Meilah', 6, 48),
    (new_id, 'קדשים', 'תמיד', 'Tamid', 7, 49),
    (new_id, 'קדשים', 'מדות', 'Middos', 5, 50),
    (new_id, 'קדשים', 'קינים', 'Kinnim', 3, 51),
    (new_id, 'טהרות', 'כלים א-ט"ו', 'Keilim 1-15', 15, 52),
    (new_id, 'טהרות', 'כלים ט"ז-ל', 'Keilim 16-30', 15, 53),
    (new_id, 'טהרות', 'אהלות', 'Oholos', 18, 54),
    (new_id, 'טהרות', 'נגעים', 'Negaim', 14, 55),
    (new_id, 'טהרות', 'פרה', 'Parah', 12, 56),
    (new_id, 'טהרות', 'טהרות', 'Taharos', 10, 57),
    (new_id, 'טהרות', 'מקואות', 'Mikvaos', 10, 58),
    (new_id, 'טהרות', 'נדה', 'Niddah', 10, 59),
    (new_id, 'טהרות', 'מכשירין', 'Machshirin', 6, 60),
    (new_id, 'טהרות', 'זבים', 'Zavim', 5, 61),
    (new_id, 'טהרות', 'טבול יום', 'Tevul Yom', 4, 62),
    (new_id, 'טהרות', 'ידים', 'Yadayim', 4, 63),
    (new_id, 'טהרות', 'עוקצין', 'Uktzin', 3, 64);

  return new_id;
end;
$$;

-- 4) Atomic claim + optional reminder.
create or replace function claim_tractate(
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
  p_manage_token text
) returns text
language plpgsql
as $$
declare
  updated_id bigint;
begin
  update tractates
  set claimed_by = p_name, claimed_at = now()
  where id = p_tractate_id
    and campaign_id = p_campaign_id
    and claimed_by is null
  returning id into updated_id;

  if updated_id is null then
    return 'already_claimed';
  end if;

  if p_want_reminder then
    insert into reminders (
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

grant execute on function public.claim_tractate(bigint, bigint, text, boolean, text, text, text, boolean, boolean, text, text) to service_role;
grant execute on function public.claim_tractate(bigint, bigint, text, boolean, text, text, text, boolean, boolean, text, text) to postgres;

-- 5) Backfill miller + nemirof: ט"ז אב תשפ"ו = 30 July 2026 (end of day, Israel).
update campaigns
set deadline_at = '2026-07-30 23:59:59+03'::timestamptz,
    timezone = 'Asia/Jerusalem'
where slug in ('nemirof', 'miller')
  and deadline_at is null;
