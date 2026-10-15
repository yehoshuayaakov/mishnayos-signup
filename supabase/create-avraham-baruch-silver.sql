-- Idempotent creation of the Avraham Baruch Silver campaign.
-- Requires migrate-reminders.sql followed by migrate-claimant-organizer-access.sql.
-- No photo and no deadline. Empty photo_url shows the memorial candle.
do $campaign$
begin
  if not exists (
    select 1
    from public.campaigns
    where slug = 'avraham-baruch-silver'
  ) then
    perform public.create_campaign(
      'avraham-baruch-silver',
      'חלוקת משניות',
      'לעל"נ אברהם ברוך בן יוסף שלמה סילבר ז"ל',
      'נלב"ע הושענא רבה כ"א תשרי תשפ"ז',
      'Click an available tractate to take it upon yourself.',
      '',
      'forest',
      '',
      null,
      'Asia/Jerusalem'
    );
  else
    raise notice 'Campaign avraham-baruch-silver already exists; theme is set to forest below.';
  end if;
end
$campaign$;

-- Creating the row is one-time. Re-running still applies the chosen theme.
update public.campaigns
set theme = 'forest'
where slug = 'avraham-baruch-silver'
  and theme is distinct from 'forest';

select
  c.id,
  c.slug,
  c.title,
  c.in_memory_of,
  c.subtitle,
  c.instructions,
  c.photo_url,
  c.theme,
  c.deadline,
  c.deadline_at,
  c.timezone,
  c.is_active,
  count(t.id) as tractate_count
from public.campaigns c
left join public.tractates t on t.campaign_id = c.id
where c.slug = 'avraham-baruch-silver'
group by c.id;
