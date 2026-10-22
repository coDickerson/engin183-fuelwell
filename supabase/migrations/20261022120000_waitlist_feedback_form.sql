-- /join is now a short feedback form. Only the first name is required, so
-- email and role become optional. Roles add family members, health
-- professionals and other (with an open answer); "child" stays valid for
-- older rows. Conditions add dialysis and other, "heard from" becomes an
-- open answer, and three new answers are stored as open text or yes/no.
alter table public.waitlist_signups alter column email drop not null;
alter table public.waitlist_signups alter column role drop not null;

alter table public.waitlist_signups drop constraint if exists waitlist_signups_role_check;
alter table public.waitlist_signups add constraint waitlist_signups_role_check
  check (role in ('patient', 'child', 'caregiver', 'family', 'professional', 'other'));

alter table public.waitlist_signups drop constraint if exists waitlist_signups_conditions_check;
alter table public.waitlist_signups add constraint waitlist_signups_conditions_check
  check (conditions <@ array['high_blood_pressure', 'diabetes', 'kidney_disease', 'dialysis', 'other']::text[]);

-- "How did you hear about us?" is now an open answer.
alter table public.waitlist_signups drop constraint if exists waitlist_signups_heard_from_check;
alter table public.waitlist_signups add constraint waitlist_signups_heard_from_check
  check (char_length(heard_from) <= 200);

alter table public.waitlist_signups
  add column role_other text check (char_length(role_other) <= 120),
  add column usual_food text check (char_length(usual_food) <= 300),
  add column hardest_part text check (char_length(hardest_part) <= 2000),
  add column wants_updates boolean;

comment on column public.waitlist_signups.heard_from is 'Open answer: how they heard about FuelWell (older rows hold a fixed choice).';
comment on column public.waitlist_signups.role_other is 'Open answer when role is "other".';
comment on column public.waitlist_signups.usual_food is 'Open answer: what kind of food the family usually cooks.';
comment on column public.waitlist_signups.hardest_part is 'Open answer: the hardest part of changing their diet.';
comment on column public.waitlist_signups.wants_updates is 'Wants the free swap guide or team updates (null = not answered).';
