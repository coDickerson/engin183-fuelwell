-- Class survey at /waitlist (the QR code in the launch video), live dish wall at /wall.
-- Flow: family dish -> do you know family/friends with kidney disease? -> 3-minute beta test
-- with feedback (each finished feedback = one gift card draw entry).
-- One browser = one response_id (made in the page). Each step inserts its own row, so earlier
-- answers still count if someone stops before the end. Visitors can insert but never read
-- emails; the wall can read only the dish columns and the yes/no tally.

-- Do you know any family or friends with kidney disease?
create table public.class_survey_answers (
  response_id uuid primary key,
  created_at timestamptz not null default now(),
  knows_someone boolean not null
);
comment on table public.class_survey_answers is 'Do you know family or friends with kidney disease? (yes/no) from the class survey at /waitlist. Anonymous; the tally shows on /wall.';

-- A dish their family makes, shown on the live wall.
-- The check blocks the obvious pranks before they reach a projector; set hidden = true in the
-- dashboard to pull anything else off the wall (it disappears within a few seconds).
create table public.dish_wall (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  response_id uuid not null,
  dish text not null check (char_length(btrim(dish)) between 1 and 40),
  origin text check (char_length(origin) <= 40),
  hidden boolean not null default false,
  constraint dish_wall_clean check (
    (dish || ' ' || coalesce(origin, '')) !~* '(fuck|shit|bitch|cunt|nigg|faggot|\mfag\M|\mdick|\mcock\M|pussy|porn|\msexy?\M|nazi|hitler|\mrape|slut|whore|retard|penis|vagina|\mkys\M|kill yourself|\manal\M|\mcum\M|\mtits?\M)'
  )
);
comment on table public.dish_wall is 'Family dishes from the class survey, shown live on /wall. Set hidden = true to remove one from the wall.';
create index dish_wall_feed_idx on public.dish_wall (created_at desc) where not hidden;

-- Beta test: try the demo for ~3 minutes, then answer a few questions. Finishing it enters
-- the gift card draw, one entry per email.
create table public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  response_id uuid not null,
  first_name text not null check (char_length(btrim(first_name)) between 1 and 80),
  email text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  tried_demo boolean not null default false,
  clarity smallint not null check (clarity between 1 and 5),
  confusing text check (char_length(confusing) <= 1000),
  would_recommend text not null check (would_recommend in ('yes', 'maybe', 'no')),
  other text check (char_length(other) <= 1000)
);
comment on table public.beta_feedback is 'Beta-tester feedback from /waitlist. Each row is one gift card draw entry. Insert-only for the public; read in the dashboard.';
create unique index beta_feedback_email_key on public.beta_feedback (lower(email));

alter table public.class_survey_answers enable row level security;
alter table public.dish_wall enable row level security;
alter table public.beta_feedback enable row level security;

revoke all on public.class_survey_answers, public.dish_wall, public.beta_feedback from anon, authenticated;

-- Inserts from the page.
grant insert on public.class_survey_answers, public.dish_wall, public.beta_feedback to anon, authenticated;
create policy "Anyone can answer the survey" on public.class_survey_answers for insert to anon, authenticated with check (true);
create policy "Anyone can add a visible dish" on public.dish_wall for insert to anon, authenticated with check (not hidden);
create policy "Anyone can send beta feedback" on public.beta_feedback for insert to anon, authenticated with check (true);

-- Reads for the wall: only these columns, only visible dishes. No emails or response ids.
grant select (knows_someone) on public.class_survey_answers to anon, authenticated;
create policy "Anyone can read the yes/no tally" on public.class_survey_answers for select to anon, authenticated using (true);
grant select (id, created_at, dish, origin) on public.dish_wall to anon, authenticated;
create policy "Anyone can read visible dishes" on public.dish_wall for select to anon, authenticated using (not hidden);

-- Sample dishes seeded before class so the board isn't empty. Visitors can't insert them;
-- leave them out of the record and remove them with: delete from public.dish_wall where sample;
alter table public.dish_wall add column sample boolean not null default false;
comment on column public.dish_wall.sample is 'Seeded example dish so the board is not empty at the start of class. Remove with: delete from dish_wall where sample;';
drop policy "Anyone can add a visible dish" on public.dish_wall;
create policy "Anyone can add a visible dish" on public.dish_wall for insert to anon, authenticated with check (not hidden and not sample);

-- /dishes (the permanent public record) shows real dishes only, so it needs to filter on sample.
grant select (sample) on public.dish_wall to anon, authenticated;
