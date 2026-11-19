-- /join now creates a real account instead of a waitlist row. Its optional phone and
-- "story or family recipe" answers live on the person's own profile (owner-only RLS).
alter table public.profiles
  add column phone text check (char_length(phone) <= 30),
  add column story text check (char_length(story) <= 4000);

comment on column public.profiles.phone is 'Optional phone number from sign-up.';
comment on column public.profiles.story is 'Optional story or family recipe shared at sign-up.';
