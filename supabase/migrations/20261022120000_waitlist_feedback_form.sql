-- /join is now a short feedback form. Only the first name is required, so
-- email and role become optional. Roles add family members and health
-- professionals ("child" stays valid for older rows), conditions add dialysis
-- and other, and three new answers are stored as open text or yes/no.
alter table public.waitlist_signups alter column email drop not null;
alter table public.waitlist_signups alter column role drop not null;

alter table public.waitlist_signups drop constraint if exists waitlist_signups_role_check;
alter table public.waitlist_signups add constraint waitlist_signups_role_check
  check (role in ('patient', 'child', 'caregiver', 'family', 'professional'));

alter table public.waitlist_signups drop constraint if exists waitlist_signups_conditions_check;
alter table public.waitlist_signups add constraint waitlist_signups_conditions_check
  check (conditions <@ array['high_blood_pressure', 'diabetes', 'kidney_disease', 'dialysis', 'other']::text[]);

alter table public.waitlist_signups
  add column usual_food text check (char_length(usual_food) <= 300),
  add column hardest_part text check (char_length(hardest_part) <= 2000),
  add column wants_updates boolean;

comment on column public.waitlist_signups.usual_food is 'Open answer: what kind of food the family usually cooks.';
comment on column public.waitlist_signups.hardest_part is 'Open answer: the hardest part of changing their diet.';
comment on column public.waitlist_signups.wants_updates is 'Wants the free swap guide or team updates (null = not answered).';
