-- A caregiver account may manage multiple patients. Clinical targets enter the
-- agent context only after a separate reviewer has marked a document reviewed.
-- (Cole's migration. Already applied to the hosted project on Nov 9 2026; copied here
-- from supabase_migrations.schema_migrations so the repo matches the database.)
create table public.patient_profiles (
  id uuid primary key default gen_random_uuid(),
  caregiver_user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 80),
  ckd_stage text check (ckd_stage is null or ckd_stage in ('g1', 'g2', 'g3', 'g3a', 'g3b', 'g4', 'g5', 'g5d', 'unsure')),
  on_dialysis boolean,
  cuisine text check (cuisine is null or char_length(cuisine) <= 80),
  food_preferences text check (food_preferences is null or char_length(food_preferences) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.patient_profiles add constraint patient_profiles_id_caregiver_unique unique (id, caregiver_user_id);
create index patient_profiles_caregiver_idx on public.patient_profiles (caregiver_user_id);
alter table public.patient_profiles enable row level security;
revoke all on public.patient_profiles from anon;
grant select, insert, update on public.patient_profiles to authenticated;
create policy patient_profiles_select_own on public.patient_profiles
  for select to authenticated using ((select auth.uid()) = caregiver_user_id);
create policy patient_profiles_insert_own on public.patient_profiles
  for insert to authenticated with check ((select auth.uid()) = caregiver_user_id);
create policy patient_profiles_update_own on public.patient_profiles
  for update to authenticated
  using ((select auth.uid()) = caregiver_user_id)
  with check ((select auth.uid()) = caregiver_user_id);

create table public.patient_care_plans (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null,
  caregiver_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  source_text text not null check (char_length(btrim(source_text)) between 20 and 12000),
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by text,
  targets jsonb not null default '{}'::jsonb check (jsonb_typeof(targets) = 'object'),
  created_at timestamptz not null default now(),
  check (status <> 'reviewed' or (reviewed_at is not null and reviewed_by is not null))
);

alter table public.patient_care_plans add constraint patient_care_plans_patient_owner_fk
  foreign key (patient_id, caregiver_user_id) references public.patient_profiles(id, caregiver_user_id) on delete cascade;
create index patient_care_plans_patient_status_idx on public.patient_care_plans (patient_id, status, reviewed_at desc);
alter table public.patient_care_plans enable row level security;
revoke all on public.patient_care_plans from anon;
grant select, insert on public.patient_care_plans to authenticated;
create policy patient_care_plans_select_own on public.patient_care_plans
  for select to authenticated using ((select auth.uid()) = caregiver_user_id);
create policy patient_care_plans_insert_pending_own on public.patient_care_plans
  for insert to authenticated
  with check (
    (select auth.uid()) = caregiver_user_id
    and status = 'pending' and reviewed_at is null and reviewed_by is null and targets = '{}'::jsonb
    and exists (select 1 from public.patient_profiles p where p.id = patient_id and p.caregiver_user_id = (select auth.uid()))
  );

comment on table public.patient_care_plans is 'Caregiver uploads are pending until a privileged clinician workflow reviews them. Only reviewed plans enter AI context.';
