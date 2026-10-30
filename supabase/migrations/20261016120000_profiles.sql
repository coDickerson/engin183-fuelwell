-- One profile per account: the name shown on the dashboard, a cuisine preference
-- and a short health history (kidney stage, high blood pressure, diabetes).
-- Only the signed-in owner can read or change their own row.
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 1 and 80),
  cuisine text check (cuisine is null or char_length(cuisine) <= 80),
  ckd_stage text check (ckd_stage is null or ckd_stage in ('g1', 'g2', 'g3', 'g3a', 'g3b', 'g4', 'g5', 'unsure')),
  has_high_blood_pressure boolean not null default false,
  has_diabetes boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Account profile shown on the dashboard: name, cuisine preference and health history. Owner-only via RLS.';

alter table public.profiles enable row level security;
revoke all on public.profiles from anon;
grant select, insert, update on public.profiles to authenticated;

create policy profiles_select_own on public.profiles
  for select to authenticated using ((select auth.uid()) = user_id);
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
