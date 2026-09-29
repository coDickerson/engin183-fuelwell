create table if not exists public.quiz_results (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('patient', 'caregiver')),
  stage text not null check (stage in ('g3b', 'g4', 'unsure')),
  goal text not null check (goal in ('familiar-meals', 'understand-options', 'prepare-conversation')),
  has_traditions boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.quiz_results enable row level security;
revoke all on public.quiz_results from anon;
grant select, insert, update on public.quiz_results to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'quiz_results' and policyname = 'quiz_results_select_own'
  ) then
    create policy quiz_results_select_own on public.quiz_results
      for select to authenticated using ((select auth.uid()) = user_id);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'quiz_results' and policyname = 'quiz_results_insert_own'
  ) then
    create policy quiz_results_insert_own on public.quiz_results
      for insert to authenticated with check ((select auth.uid()) = user_id);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'quiz_results' and policyname = 'quiz_results_update_own'
  ) then
    create policy quiz_results_update_own on public.quiz_results
      for update to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id);
  end if;
end
$$;
