-- /join now lists kidney disease alongside high blood pressure and diabetes,
-- so "conditions" can hold all three.
alter table public.waitlist_signups drop constraint if exists waitlist_signups_conditions_check;
alter table public.waitlist_signups add constraint waitlist_signups_conditions_check
  check (conditions <@ array['high_blood_pressure', 'diabetes', 'kidney_disease']::text[]);
