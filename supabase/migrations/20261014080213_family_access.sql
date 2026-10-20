-- Family access is based on database membership, never user-editable JWT metadata.
-- Keep privileged membership lookups out of the exposed public schema.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

-- Preserve the identity of the shared, publicly credentialed demo account even
-- if its email is later changed. The email check also covers a demo account
-- created after this migration is applied.
create table private.blocked_family_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade
);
insert into private.blocked_family_accounts (user_id)
  select id from auth.users where lower(email) = 'heidi_demo@fuelwell.app';

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.family_members (
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'caregiver', 'patient', 'viewer')),
  joined_at timestamptz not null default now(),
  primary key (family_id, user_id)
);
create unique index family_members_one_owner on public.family_members (family_id) where role = 'owner';
create index family_members_user_id_idx on public.family_members (user_id, family_id);

create table public.family_invites (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  email text not null check (char_length(email) between 3 and 254),
  role text not null check (role in ('caregiver', 'patient', 'viewer')),
  token_hash text not null unique,
  invited_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz
);
create index family_invites_family_id_idx on public.family_invites (family_id);

-- Shared notes only. Patient-specific clinical records need a separate access model.
create table public.family_records (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  record_type text not null check (record_type = 'note'),
  payload jsonb not null check (
    jsonb_typeof(payload) = 'object'
    and payload ? 'text'
    and jsonb_typeof(payload -> 'text') = 'string'
    and char_length(btrim(payload ->> 'text')) between 1 and 1000
  ),
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index family_records_family_id_created_at_idx
  on public.family_records (family_id, created_at desc);

create function private.is_eligible_family_user()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from auth.users u
    where u.id = auth.uid()
      and u.is_anonymous is false
      and u.email_confirmed_at is not null
      and lower(u.email) <> 'heidi_demo@fuelwell.app'
      and not exists (
        select 1 from private.blocked_family_accounts b where b.user_id = u.id
      )
  );
$$;
revoke all on function private.is_eligible_family_user() from public, anon;
grant execute on function private.is_eligible_family_user() to authenticated;

create function private.has_family_role(p_family_id uuid, p_roles text[])
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select private.is_eligible_family_user() and exists (
    select 1 from public.family_members m
    where m.family_id = p_family_id
      and m.user_id = auth.uid()
      and m.role = any (p_roles)
  );
$$;
revoke all on function private.has_family_role(uuid, text[]) from public, anon;
grant execute on function private.has_family_role(uuid, text[]) to authenticated;

alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.family_invites enable row level security;
alter table public.family_records enable row level security;

revoke all on public.families, public.family_members, public.family_invites, public.family_records
  from anon, authenticated;
grant select on public.families, public.family_members, public.family_records to authenticated;
grant select (id, family_id, email, role, invited_by, created_at, expires_at, accepted_at, revoked_at)
  on public.family_invites to authenticated;
grant update (name) on public.families to authenticated;
grant insert (family_id, record_type, payload) on public.family_records to authenticated;

create policy families_read_members on public.families for select to authenticated
  using (private.has_family_role(id, array['owner','caregiver','patient','viewer']));
create policy families_rename_owner on public.families for update to authenticated
  using (private.has_family_role(id, array['owner']))
  with check (private.has_family_role(id, array['owner']));

create policy family_members_read_family on public.family_members for select to authenticated
  using (private.has_family_role(family_id, array['owner','caregiver','patient','viewer']));

create policy family_invites_read_owner on public.family_invites for select to authenticated
  using (private.has_family_role(family_id, array['owner']));

create policy family_records_read_family on public.family_records for select to authenticated
  using (private.has_family_role(family_id, array['owner','caregiver','patient','viewer']));
create policy family_records_insert_writers on public.family_records for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and private.has_family_role(family_id, array['owner','caregiver','patient'])
  );

-- Atomic bootstrap: direct membership insert is intentionally unavailable.
create function public.create_family(p_name text)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_family uuid;
begin
  if v_user is null then raise exception 'Sign in required' using errcode = '28000'; end if;
  if not private.is_eligible_family_user() then
    raise exception 'A confirmed, permanent account is required' using errcode = '42501';
  end if;
  if char_length(btrim(p_name)) not between 1 and 100 then
    raise exception 'Family name must be 1 to 100 characters' using errcode = '22023';
  end if;
  insert into public.families (name, created_by) values (btrim(p_name), v_user)
    returning id into v_family;
  insert into public.family_members (family_id, user_id, role)
    values (v_family, v_user, 'owner');
  return v_family;
end;
$$;
revoke all on function public.create_family(text) from public, anon;
grant execute on function public.create_family(text) to authenticated;

-- The returned token is shown once to the inviter. Only its SHA-256 hash is stored.
-- The UI can pass the token to the intended relative over a trusted channel.
create function public.invite_family_member(
  p_family_id uuid, p_email text, p_role text default 'caregiver'
)
returns text
language plpgsql security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_email text := lower(btrim(p_email));
  v_token text := gen_random_uuid()::text;
begin
  if v_user is null then raise exception 'Sign in required' using errcode = '28000'; end if;
  if not private.has_family_role(p_family_id, array['owner']) then
    raise exception 'Only the family owner can invite members' using errcode = '42501';
  end if;
  if p_role not in ('caregiver', 'patient', 'viewer') or p_role is null then
    raise exception 'Invalid family role' using errcode = '22023';
  end if;
  if char_length(v_email) not between 3 and 254 or
     v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Invalid email address' using errcode = '22023';
  end if;
  if v_email = 'heidi_demo@fuelwell.app' then
    raise exception 'The shared demo account cannot join families' using errcode = '42501';
  end if;
  insert into public.family_invites
    (family_id, email, role, token_hash, invited_by, expires_at)
  values
    (p_family_id, v_email, p_role, encode(sha256(v_token::bytea), 'hex'), v_user,
     now() + interval '7 days');
  return v_token;
end;
$$;
revoke all on function public.invite_family_member(uuid, text, text) from public, anon;
grant execute on function public.invite_family_member(uuid, text, text) to authenticated;

create function public.accept_family_invite(p_token text)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_email text;
  v_invite public.family_invites%rowtype;
begin
  if v_user is null then raise exception 'Sign in required' using errcode = '28000'; end if;
  if not private.is_eligible_family_user() then
    raise exception 'A confirmed, permanent account is required' using errcode = '42501';
  end if;
  select lower(email) into v_email from auth.users
    where id = v_user and email_confirmed_at is not null;
  if v_email is null then
    raise exception 'Confirm your email before joining a family' using errcode = '28000';
  end if;
  select * into v_invite from public.family_invites
    where token_hash = encode(sha256(p_token::bytea), 'hex')
      and accepted_at is null and revoked_at is null and expires_at > now()
    for update;
  if not found or v_invite.email <> v_email then
    raise exception 'Invitation is invalid, expired, or for another email' using errcode = '22023';
  end if;
  insert into public.family_members (family_id, user_id, role)
    values (v_invite.family_id, v_user, v_invite.role)
    on conflict (family_id, user_id) do nothing;
  update public.family_invites set accepted_at = now() where id = v_invite.id;
  return v_invite.family_id;
end;
$$;
revoke all on function public.accept_family_invite(text) from public, anon;
grant execute on function public.accept_family_invite(text) to authenticated;

create function public.revoke_family_invite(p_invite_id uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_family uuid;
begin
  if auth.uid() is null then raise exception 'Sign in required' using errcode = '28000'; end if;
  select family_id into v_family from public.family_invites
    where id = p_invite_id for update;
  if v_family is null or not private.has_family_role(v_family, array['owner']) then
    raise exception 'Invitation not found or access denied' using errcode = '42501';
  end if;
  update public.family_invites set revoked_at = now()
    where id = p_invite_id and accepted_at is null and revoked_at is null;
end;
$$;
revoke all on function public.revoke_family_invite(uuid) from public, anon;
grant execute on function public.revoke_family_invite(uuid) to authenticated;

-- Email is shown only to the owner managing family membership. Other members
-- can see roles and user IDs via family_members, but cannot read auth.users.
create function public.list_family_member_emails(p_family_id uuid)
returns table (user_id uuid, email text, role text)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Sign in required' using errcode = '28000'; end if;
  if not private.has_family_role(p_family_id, array['owner']) then
    raise exception 'Only the family owner can list member emails' using errcode = '42501';
  end if;
  return query
    select m.user_id, u.email::text, m.role
    from public.family_members m
    join auth.users u on u.id = m.user_id
    where m.family_id = p_family_id and u.email_confirmed_at is not null
    order by m.joined_at, m.user_id;
end;
$$;
revoke all on function public.list_family_member_emails(uuid) from public, anon;
grant execute on function public.list_family_member_emails(uuid) to authenticated;

create function public.remove_family_member(p_family_id uuid, p_user_id uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Sign in required' using errcode = '28000'; end if;
  if not private.has_family_role(p_family_id, array['owner']) then
    raise exception 'Only the family owner can remove members' using errcode = '42501';
  end if;
  if exists (select 1 from public.family_members
             where family_id = p_family_id and user_id = p_user_id and role = 'owner') then
    raise exception 'Cannot remove the family owner' using errcode = '22023';
  end if;
  delete from public.family_members where family_id = p_family_id and user_id = p_user_id;
end;
$$;
revoke all on function public.remove_family_member(uuid, uuid) from public, anon;
grant execute on function public.remove_family_member(uuid, uuid) to authenticated;
