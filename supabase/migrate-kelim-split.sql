-- Run once in Supabase SQL Editor on the live database.
-- Splits Kelim (30 perakim) into two adjacent signup slots.

update tractates
set name = 'כלים א-ט"ו', chapters = 15, sort_order = 52
where id = 52;

insert into tractates (id, seder, name, chapters, sort_order)
values (64, 'טהרות', 'כלים ט"ז-ל', 15, 53)
on conflict (id) do update
  set name = excluded.name, chapters = excluded.chapters, sort_order = excluded.sort_order;

-- If sort_order column was missing, add it first (safe to run migrate-kelim-sort-order.sql instead).
alter table tractates add column if not exists sort_order integer;
update tractates set sort_order = id where sort_order is null and id not in (52, 64);
update tractates set sort_order = 53 where id = 64;
update tractates set sort_order = id + 1 where id between 53 and 63;
alter table tractates alter column sort_order set not null;
