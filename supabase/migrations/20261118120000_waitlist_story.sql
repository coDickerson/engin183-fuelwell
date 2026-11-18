-- /join is now a swap guide plus a short sign-up: name, email, optional phone,
-- and an optional story or family recipe. The older questions' columns stay so
-- earlier answers are kept; new signups leave them empty.
alter table public.waitlist_signups
  add column story text check (char_length(story) <= 4000);

comment on column public.waitlist_signups.story is 'Optional: a story or family recipe the person chose to share.';
