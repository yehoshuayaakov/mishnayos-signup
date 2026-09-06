-- Multi-campaign schema. Run once in the Supabase SQL Editor
-- (dashboard -> SQL Editor -> New query -> paste -> Run).
--
-- WARNING: this DROPs and recreates the tables. If you have existing signup data,
-- take a backup first (see scripts/backup-tractates.mjs or supabase/backups/README.md).
--
-- One database hosts many campaigns. Each campaign has its own 64 tractate slots.
-- Adding a new campaign later is a single call: select create_campaign(...);

drop function if exists create_campaign(text, text, text, text, text, text);
drop function if exists create_campaign(text, text, text, text, text, text, text, text);
drop table if exists tractates;
drop table if exists campaigns;

-- One row per person/campaign being learned for.
create table campaigns (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title text not null,
  in_memory_of text not null,
  subtitle text not null default '',
  deadline text not null default '',   -- e.g. "נא לסיים עד ..." shown as its own line
  instructions text not null default '',
  photo_url text not null default '',
  theme text not null default 'navy',  -- color preset: navy | forest | burgundy | slate
  is_active boolean not null default true,
  admin_token text,            -- reserved for future per-campaign admin links (unused for now)
  created_at timestamptz not null default now()
);

-- 64 tractate slots per campaign.
create table tractates (
  id bigint generated always as identity primary key,
  campaign_id bigint not null references campaigns(id) on delete cascade,
  seder text not null,
  name text not null,          -- Hebrew name shown in the UI
  name_en text not null default '', -- English (Ashkenazi transliteration), for future use
  chapters integer not null,
  sort_order integer not null,
  claimed_by text,
  claimed_at timestamptz
);

create index tractates_campaign_sort_idx on tractates (campaign_id, sort_order);

-- All access goes through server-side API routes using the service_role key,
-- which BYPASSES row level security. We enable RLS with NO policies so the
-- public anon/authenticated keys (never used by this app) get zero access,
-- while the server (service_role) keeps full access.
alter table campaigns enable row level security;
alter table tractates enable row level security;

grant all on table public.campaigns to service_role;
grant all on table public.campaigns to postgres;
grant all on table public.tractates to service_role;
grant all on table public.tractates to postgres;

-- Creates a campaign and seeds all 64 tractate slots (Kelim split in two).
-- Returns the new campaign id.
create or replace function create_campaign(
  p_slug text,
  p_title text,
  p_in_memory_of text,
  p_subtitle text,
  p_instructions text,
  p_photo_url text,
  p_theme text default 'navy',
  p_deadline text default ''
) returns bigint
language plpgsql
as $$
declare
  new_id bigint;
begin
  insert into campaigns (slug, title, in_memory_of, subtitle, instructions, photo_url, theme, deadline)
  values (p_slug, p_title, p_in_memory_of, p_subtitle, p_instructions, p_photo_url, p_theme, p_deadline)
  returning id into new_id;

  insert into tractates (campaign_id, seder, name, name_en, chapters, sort_order) values
    -- סדר זרעים
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
    -- סדר מועד
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
    -- סדר נשים
    (new_id, 'נשים', 'יבמות', 'Yevamos', 16, 24),
    (new_id, 'נשים', 'כתובות', 'Kesubos', 13, 25),
    (new_id, 'נשים', 'נדרים', 'Nedarim', 11, 26),
    (new_id, 'נשים', 'נזיר', 'Nazir', 9, 27),
    (new_id, 'נשים', 'סוטה', 'Sotah', 9, 28),
    (new_id, 'נשים', 'גיטין', 'Gittin', 9, 29),
    (new_id, 'נשים', 'קידושין', 'Kiddushin', 4, 30),
    -- סדר נזיקין
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
    -- סדר קדשים
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
    -- סדר טהרות (Kelim split into two adjacent slots)
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

-- Seed the first campaign. No photo yet -> the UI shows the candle fallback.
-- Args: slug, title, in_memory_of, subtitle, instructions, photo_url, theme, deadline
select create_campaign(
  'nemirof',
  'חלוקת משניות',
  'ר'' חיים רפאל יצחק הערשל בן ר'' דוד נעמירוף ז"ל',
  'נלב"ע כ"ז סיון תשפ"ו',
  'לחצו על מסכת פנויה כדי לקבל אותה על עצמכם',
  '',
  'navy',
  'נא לסיים עד ט"ז אב תשפ"ו'
);
