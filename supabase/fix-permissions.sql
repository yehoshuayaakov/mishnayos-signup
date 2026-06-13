-- Run this in Supabase SQL Editor if you see:
-- {"error":"permission denied for table tractates"}

alter table public.tractates disable row level security;

grant all on table public.tractates to service_role;
grant all on table public.tractates to postgres;
