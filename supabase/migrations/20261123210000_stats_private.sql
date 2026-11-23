-- Make /stats private. fuelwell_stats() used to be callable by anyone (anon). Now only signed-in
-- accounts listed in public.stats_viewers can read it; everyone else gets "not allowed".
-- Add a viewer in the SQL editor (never in a migration, so no emails land in the repo):
--   insert into public.stats_viewers (user_id) select id from auth.users where email = 'someone@example.com';

create table if not exists public.stats_viewers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);
comment on table public.stats_viewers is 'Accounts allowed to read fuelwell_stats(). Managed by hand in the SQL editor; no API access.';
alter table public.stats_viewers enable row level security;
revoke all on public.stats_viewers from anon, authenticated;

create or replace function public.fuelwell_stats(since timestamptz default '2026-11-01 00:00:00-07')
returns table (metric text, all_time bigint, today bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.stats_viewers v where v.user_id = (select auth.uid())) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  return query
  with e as (
    select ev.name, ev.visitor_id, ev.source, ev.created_at,
           ev.created_at >= date_trunc('day', now() at time zone 'America/Los_Angeles') at time zone 'America/Los_Angeles' as is_today
    from public.app_events ev
    where ev.created_at >= since
  ),
  w as (
    select s.created_at >= date_trunc('day', now() at time zone 'America/Los_Angeles') at time zone 'America/Los_Angeles' as is_today
    from public.waitlist_signups s
    where s.created_at >= since
  ),
  a as (
    select u.created_at >= date_trunc('day', now() at time zone 'America/Los_Angeles') at time zone 'America/Los_Angeles' as is_today
    from auth.users u
    where u.created_at >= since and lower(u.email) <> 'heidi_demo@fuelwell.app'
  )
  select 'visitors', count(distinct visitor_id), count(distinct visitor_id) filter (where is_today) from e
  union all
  select 'qr_visitors', count(distinct visitor_id) filter (where source = 'qr'), count(distinct visitor_id) filter (where source = 'qr' and is_today) from e
  union all
  select 'demo_opens', count(distinct visitor_id) filter (where name = 'demo_open'), count(distinct visitor_id) filter (where name = 'demo_open' and is_today) from e
  union all
  select 'tries_finished', count(distinct visitor_id) filter (where name = 'try_finished'), count(distinct visitor_id) filter (where name = 'try_finished' and is_today) from e
  union all
  select 'swaps_saved', count(*) filter (where name = 'swap_saved'), count(*) filter (where name = 'swap_saved' and is_today) from e
  union all
  select 'signup_clicks', count(distinct visitor_id) filter (where name = 'signup_prompt_click'), count(distinct visitor_id) filter (where name = 'signup_prompt_click' and is_today) from e
  union all
  select 'waitlist_signups', count(*), count(*) filter (where is_today) from w
  union all
  select 'accounts_created', count(*), count(*) filter (where is_today) from a;
end;
$$;

revoke all on function public.fuelwell_stats(timestamptz) from public, anon;
grant execute on function public.fuelwell_stats(timestamptz) to authenticated;
