-- Feedback on AI answers, and a small per-family memory that personalizes later answers.
--
-- answer_feedback: thumbs up/down under each Ask FuelWell answer (with a reason on thumbs down).
--   The team reads it in the dashboard to find weak answers. Owners can add and read their own.
-- family_memory: short preference notes from the family's own clicks ("We'll try it" / "Not for us"
--   on a swap, and the dishes they asked about). The newest few go into the AI prompt as
--   preferences only (never medical facts). Owners can read, add and delete ("Forget") their own.
-- Both are removed with the account (on delete cascade).

create table public.answer_feedback (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  mode text not null check (mode in ('swap', 'eatout', 'recipe')),
  question text check (char_length(question) <= 300),
  answer_title text check (char_length(answer_title) <= 200),
  rating text not null check (rating in ('up', 'down')),
  reason text check (reason in ('not_answered', 'not_our_food', 'seems_wrong', 'too_long')),
  is_demo boolean not null default false
);
comment on table public.answer_feedback is 'Thumbs up/down on Ask FuelWell answers. Insert/read own rows; the team reviews them in the dashboard.';
create index answer_feedback_user_created_idx on public.answer_feedback (user_id, created_at desc);
alter table public.answer_feedback enable row level security;
revoke all on public.answer_feedback from anon, authenticated;
grant select, insert on public.answer_feedback to authenticated;
create policy answer_feedback_insert_own on public.answer_feedback
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy answer_feedback_select_own on public.answer_feedback
  for select to authenticated using (user_id = (select auth.uid()));

create table public.family_memory (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('tried', 'not_for_us', 'asked')),
  text text not null check (char_length(text) between 1 and 140),
  unique (user_id, kind, text)
);
comment on table public.family_memory is 'Per-account preference notes for the AI prompt (preferences only, never medical facts). Owner read/insert/delete via RLS.';
create index family_memory_user_created_idx on public.family_memory (user_id, created_at desc);
alter table public.family_memory enable row level security;
revoke all on public.family_memory from anon, authenticated;
grant select, insert, delete on public.family_memory to authenticated;
create policy family_memory_select_own on public.family_memory
  for select to authenticated using (user_id = (select auth.uid()));
create policy family_memory_insert_own on public.family_memory
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy family_memory_delete_own on public.family_memory
  for delete to authenticated using (user_id = (select auth.uid()));
