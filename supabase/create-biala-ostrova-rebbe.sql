-- One-time, idempotent creation of the Biala Ostrova Rebbe campaign.
-- Requires migrate-reminders.sql followed by migrate-claimant-organizer-access.sql.
do $campaign$
begin
  if not exists (
    select 1
    from public.campaigns
    where slug = 'biala-ostrova-rebbe'
  ) then
    perform public.create_campaign(
      'biala-ostrova-rebbe',
      'חלוקת משניות',
      'כ"ק האדמו"ר מביאלא אוסטרובא רבי אברהם ירחמיאל בן הרה"ק דוד מתתיהו זצ"ל',
      'נלב"ע ח"י אלול תשפ"ו',
      'לחצו על מסכת פנויה כדי לקבל אותה על עצמכם. לשאלות או לתיקונים: yehoshuayaakov@gmail.com',
      '/biala-ostrova-rebbe.jpg',
      'navy',
      'נא לסיים עד י"ט תשרי תשפ"ז',
      '2026-09-30 23:59:59+03',
      'Asia/Jerusalem'
    );
  else
    raise notice 'Campaign biala-ostrova-rebbe already exists; no changes made.';
  end if;
end
$campaign$;

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
where c.slug = 'biala-ostrova-rebbe'
group by c.id;
