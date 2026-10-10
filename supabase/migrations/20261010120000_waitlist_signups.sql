-- Public waitlist for early users. Visitors can add a row but cannot read,
-- change or delete any rows; the team views signups in the Supabase dashboard.
create table public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  first_name text not null check (char_length(btrim(first_name)) between 1 and 80),
  email text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (char_length(phone) <= 30),
  role text not null check (role in ('patient', 'child', 'caregiver')),
  kidney_stage text check (kidney_stage in ('at_risk', 'stage_2', 'stage_3', 'stage_4', 'dialysis', 'not_sure')),
  conditions text[] not null default '{}'
    check (conditions <@ array['diabetes', 'high_blood_pressure']::text[]),
  cuisines text[] not null default '{}'
    check (cardinality(cuisines) <= 12 and cuisines <@ array['chinese', 'vietnamese', 'korean', 'japanese', 'filipino', 'south_asian', 'mexican_latin', 'caribbean', 'soul_food', 'middle_eastern', 'american', 'other']::text[]),
  cuisine_other text check (char_length(cuisine_other) <= 120),
  challenge text check (challenge in ('safe_foods', 'family_recipes', 'cooking_for_all', 'labs', 'groceries', 'other')),
  heard_from text check (heard_from in ('reddit', 'facebook', 'friend', 'clinic', 'other')),
  language text not null default 'en' check (language in ('en', 'zh-Hans', 'zh-Hant', 'es'))
);

comment on table public.waitlist_signups is 'Early-access waitlist from /waitlist. Insert-only for the public; read in the dashboard.';

-- One signup per email; the page treats a repeat as success.
create unique index waitlist_signups_email_key on public.waitlist_signups (lower(email));

alter table public.waitlist_signups enable row level security;

revoke all on public.waitlist_signups from anon, authenticated;
grant insert on public.waitlist_signups to anon, authenticated;

create policy "Anyone can join the waitlist"
  on public.waitlist_signups for insert
  to anon, authenticated
  with check (true);
