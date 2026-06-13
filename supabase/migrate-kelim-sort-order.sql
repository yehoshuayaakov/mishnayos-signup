-- Run once in Supabase SQL Editor after migrate-kelim-split.sql.
-- Keeps both Kelim halves adjacent in the list (sort_order 52, 53).

alter table tractates add column if not exists sort_order integer;

update tractates set sort_order = id where sort_order is null;

update tractates set sort_order = 53 where id = 64;
update tractates set sort_order = id + 1 where id between 53 and 63;

alter table tractates alter column sort_order set not null;
