-- 002_ai_usage.sql: per-user daily quota for the FuelWell AI Edge Functions.
--
-- Access model
--   * RLS is enabled and there are deliberately NO policies, and table/function
--     privileges are revoked from anon and authenticated. Browsers cannot read or
--     write this table, even through the Data API or RPC.
--   * Only the Edge Functions touch it, with the service_role key that Supabase
--     injects as SUPABASE_SERVICE_ROLE_KEY (service_role bypasses RLS).
--   * Limits (40/day, 300/day for the shared demo account) are decided in the
--     function code and passed in as p_limit.

create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default ((now() at time zone 'utc')::date),
  calls integer not null default 0 check (calls >= 0),
  last_function text,
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

comment on table public.ai_usage is
  'Daily AI call counter per user. Written only by Edge Functions via service_role.';

alter table public.ai_usage enable row level security;
revoke all on table public.ai_usage from anon, authenticated;
grant select, insert, update, delete on table public.ai_usage to service_role;

-- Atomic check-and-increment in one statement.
-- INSERT ... ON CONFLICT DO UPDATE ... WHERE takes a row lock, so two concurrent
-- calls cannot both slip under the limit. When the WHERE fails, no row is
-- returned and the call is reported as not allowed.
create or replace function public.ai_usage_consume(p_user_id uuid, p_function text, p_limit integer)
returns table (allowed boolean, used integer)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'utc')::date;
  v_calls integer;
begin
  if p_limit is null or p_limit < 1 then
    raise exception 'p_limit must be positive';
  end if;

  insert into public.ai_usage as u (user_id, usage_date, calls, last_function, updated_at)
  values (p_user_id, v_today, 1, left(p_function, 40), now())
  on conflict (user_id, usage_date) do update
    set calls = u.calls + 1,
        last_function = excluded.last_function,
        updated_at = now()
    where u.calls < p_limit
  returning u.calls into v_calls;

  if v_calls is not null then
    return query select true, v_calls;
  else
    return query
      select false, coalesce((select a.calls from public.ai_usage a
                              where a.user_id = p_user_id and a.usage_date = v_today), p_limit);
  end if;
end;
$$;

-- Functions in public are executable by PUBLIC by default; lock it to service_role.
revoke all on function public.ai_usage_consume(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.ai_usage_consume(uuid, text, integer) to service_role;

-- Optional housekeeping (run manually or from pg_cron): keep 30 days of counters.
-- delete from public.ai_usage where usage_date < (now() at time zone 'utc')::date - 30;
