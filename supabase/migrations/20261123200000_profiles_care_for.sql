-- Who the account cooks for, so the app and the AI say "Dad" or "Grandma" (or "you") instead of
-- the demo's "Mom". Asked on /personalize right after sign-up. Optional; owner-only RLS on profiles
-- already applies (table-level grants cover new columns).
--   care_for        'mom', 'dad', 'grandma', 'grandpa', 'partner', 'child' or 'other' (when for_whom = 'family')
--   care_for_name   what they call that person, e.g. "Ma" or "Auntie Lin" (optional, up to 40 characters)
alter table public.profiles
  add column care_for text check (care_for in ('mom', 'dad', 'grandma', 'grandpa', 'partner', 'child', 'other')),
  add column care_for_name text check (char_length(care_for_name) between 1 and 40);

comment on column public.profiles.care_for is 'Who a caregiver cooks for: mom, dad, grandma, grandpa, partner, child or other.';
comment on column public.profiles.care_for_name is 'Optional name the caregiver uses for that person, shown in the app and given to the AI.';
