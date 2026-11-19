-- One exchange per row. Only the Edge Function writes answers; signed-in users
-- may read their own history. The public shared demo account is never saved.
-- (Cole's migration. Already applied to the hosted project on Nov 9 2026.)
create table public.chat_exchanges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid,
  question text not null check (char_length(question) between 1 and 4000),
  answer text not null check (char_length(answer) between 1 and 12000),
  source text not null check (source in ('ai', 'rules')),
  citations jsonb not null default '[]'::jsonb check (jsonb_typeof(citations) = 'array'),
  created_at timestamptz not null default now(),
  constraint chat_exchanges_owned_patient foreign key (patient_id, user_id)
    references public.patient_profiles(id, caregiver_user_id) on delete cascade
);

create index chat_exchanges_user_created_idx on public.chat_exchanges (user_id, created_at desc);
alter table public.chat_exchanges enable row level security;
revoke all on public.chat_exchanges from anon, authenticated;
grant select on public.chat_exchanges to authenticated;
grant select, insert on public.chat_exchanges to service_role;
create policy chat_exchanges_select_own on public.chat_exchanges
  for select to authenticated using ((select auth.uid()) = user_id);

comment on table public.chat_exchanges is 'Private AI chat exchanges. Written by chat-agent; readable only by the account owner.';
