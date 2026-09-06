-- Run this in Supabase SQL Editor if you see:
-- {"error":"permission denied for table tractates"} (or campaigns)
--
-- The server uses the service_role key, which bypasses RLS. These grants
-- restore its access; RLS stays enabled so public keys get no access.

alter table public.campaigns enable row level security;
alter table public.tractates enable row level security;
alter table public.reminders enable row level security;
alter table public.reminder_sends enable row level security;

grant all on table public.campaigns to service_role;
grant all on table public.campaigns to postgres;
grant all on table public.tractates to service_role;
grant all on table public.tractates to postgres;
grant all on table public.reminders to service_role;
grant all on table public.reminders to postgres;
grant all on table public.reminder_sends to service_role;
grant all on table public.reminder_sends to postgres;
