-- /personalize: after sign-up, people tell FuelWell their kidney score and what their care team
-- limits, so Meals answers fit them. All optional; owner-only RLS on profiles already applies.
--   egfr               the latest eGFR the person knows (ml/min/1.73m2); the page shows its KDIGO stage
--   for_whom           'me' or 'family' (a caregiver setting it up for someone)
--   usually            how they usually eat: home cooking, frozen meals or takeout
--   limit_*            what the care team said: 'limit', 'no_limit' or 'unsure'
alter table public.profiles
  add column egfr smallint check (egfr between 0 and 200),
  add column for_whom text check (for_whom in ('me', 'family')),
  add column usually text check (usually in ('home', 'frozen', 'takeout')),
  add column limit_potassium text check (limit_potassium in ('limit', 'no_limit', 'unsure')),
  add column limit_phosphorus text check (limit_phosphorus in ('limit', 'no_limit', 'unsure')),
  add column limit_sodium text check (limit_sodium in ('limit', 'no_limit', 'unsure')),
  add column limit_fluid text check (limit_fluid in ('limit', 'no_limit', 'unsure'));

comment on column public.profiles.egfr is 'Optional: latest eGFR the person entered on /personalize.';
comment on column public.profiles.limit_potassium is 'Care-team potassium limit: limit, no_limit or unsure.';
