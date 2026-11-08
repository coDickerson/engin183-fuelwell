-- Anonymous usage counts for the class competition: visits, demo opens, finished tries,
-- saved swaps and sign-up prompts. No names, emails or IP addresses: each browser gets a
-- random visitor_id kept in localStorage.
-- Visitors can add rows but cannot read them; the totals come from public.fuelwell_stats().
create table public.app_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (name in (
    'page_view', 'demo_open', 'try_finished', 'swap_saved',
    'signup_prompt_shown', 'signup_prompt_click', 'signup_prompt_dismiss', 'signup'
  )),
  visitor_id uuid not null,
  path text check (char_length(path) <= 120),
  source text check (char_length(source) <= 40),
  demo boolean not null default false,
  detail text check (char_length(detail) <= 80)
);

comment on table public.app_events is 'Anonymous usage events from the site. Insert-only for the public; totals via fuelwell_stats().';

create index app_events_name_created_idx on public.app_events (name, created_at);

alter table public.app_events enable row level security;

revoke all on public.app_events from anon, authenticated;
grant insert on public.app_events to anon, authenticated;

create policy "Anyone can add a usage event"
  on public.app_events for insert
  to anon, authenticated
  with check (true);

-- Totals for /stats: people (distinct browsers) unless the metric says otherwise.
-- "Today" is the Pacific-time calendar day.
create or replace function public.fuelwell_stats(since timestamptz default '2026-11-01 00:00:00-07')
returns table (metric text, all_time bigint, today bigint)
language sql
stable
security definer
set search_path = ''
as $$
  with e as (
    select name, visitor_id, source, created_at,
           created_at >= date_trunc('day', now() at time zone 'America/Los_Angeles') at time zone 'America/Los_Angeles' as is_today
    from public.app_events
    where created_at >= since
  ),
  w as (
    select created_at >= date_trunc('day', now() at time zone 'America/Los_Angeles') at time zone 'America/Los_Angeles' as is_today
    from public.waitlist_signups
    where created_at >= since
  ),
  a as (
    select created_at >= date_trunc('day', now() at time zone 'America/Los_Angeles') at time zone 'America/Los_Angeles' as is_today
    from auth.users
    where created_at >= since and lower(email) <> 'heidi_demo@fuelwell.app'
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
$$;

revoke all on function public.fuelwell_stats(timestamptz) from public;
grant execute on function public.fuelwell_stats(timestamptz) to anon, authenticated;
