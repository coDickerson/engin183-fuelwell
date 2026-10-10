-- Which parts of FuelWell a waitlist signup cares about most (optional, multi-select).
alter table public.waitlist_signups
  add column interests text[] not null default '{}'
    check (interests <@ array['meal_planning', 'health_records', 'dietitian', 'care_team']::text[]);
