-- The owner controls access to a family's shared notes per member. Existing
-- caregivers and patients keep write access; viewers keep read-only access.
alter table public.family_members
  add column notes_access text not null default 'write'
  check (notes_access in ('none', 'read', 'write'));
update public.family_members set notes_access = 'read' where role = 'viewer';
alter table public.family_members
  add constraint owner_has_full_note_access check (role <> 'owner' or notes_access = 'write');

alter table public.family_invites
  add column notes_access text not null default 'write'
  check (notes_access in ('none', 'read', 'write'));
update public.family_invites set notes_access = 'read' where role = 'viewer';
grant select (notes_access) on public.family_invites to authenticated;

-- Read and write checks run against current membership, including after an
-- owner changes permissions or removes a member.
create function private.has_family_note_access(p_family_id uuid, p_allowed text[])
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select private.is_eligible_family_user() and exists (
    select 1 from public.family_members m
    where m.family_id = p_family_id
      and m.user_id = auth.uid()
      and m.notes_access = any (p_allowed)
  );
$$;
revoke all on function private.has_family_note_access(uuid, text[]) from public, anon;
grant execute on function private.has_family_note_access(uuid, text[]) to authenticated;

drop policy family_records_read_family on public.family_records;
create policy family_records_read_family on public.family_records for select to authenticated
  using (private.has_family_note_access(family_id, array['read','write']));
drop policy family_records_insert_writers on public.family_records;
create policy family_records_insert_writers on public.family_records for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and private.has_family_note_access(family_id, array['write'])
  );

-- Replace the old three-argument invitation endpoint. The owner chooses the
-- initial access level and can change it after the invitation is accepted.
drop function public.invite_family_member(uuid, text, text);
create function public.invite_family_member(
  p_family_id uuid, p_email text, p_role text, p_notes_access text
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
  if p_notes_access not in ('none', 'read', 'write') or p_notes_access is null then
    raise exception 'Invalid notes access' using errcode = '22023';
  end if;
  if char_length(v_email) not between 3 and 254 or
     v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Invalid email address' using errcode = '22023';
  end if;
  if v_email = 'heidi_demo@fuelwell.app' then
    raise exception 'The shared demo account cannot join families' using errcode = '42501';
  end if;
  insert into public.family_invites
    (family_id, email, role, notes_access, token_hash, invited_by, expires_at)
  values
    (p_family_id, v_email, p_role, p_notes_access,
     encode(sha256(v_token::bytea), 'hex'), v_user, now() + interval '7 days');
  return v_token;
end;
$$;
revoke all on function public.invite_family_member(uuid, text, text, text) from public, anon;
grant execute on function public.invite_family_member(uuid, text, text, text) to authenticated;

create or replace function public.accept_family_invite(p_token text)
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
  insert into public.family_members (family_id, user_id, role, notes_access)
    values (v_invite.family_id, v_user, v_invite.role, v_invite.notes_access)
    on conflict (family_id, user_id) do nothing;
  update public.family_invites set accepted_at = now() where id = v_invite.id;
  return v_invite.family_id;
end;
$$;

create function public.set_family_member_notes_access(
  p_family_id uuid, p_user_id uuid, p_notes_access text
)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Sign in required' using errcode = '28000'; end if;
  if not private.has_family_role(p_family_id, array['owner']) then
    raise exception 'Only the family owner can change access' using errcode = '42501';
  end if;
  if p_notes_access not in ('none', 'read', 'write') or p_notes_access is null then
    raise exception 'Invalid notes access' using errcode = '22023';
  end if;
  update public.family_members set notes_access = p_notes_access
    where family_id = p_family_id and user_id = p_user_id and role <> 'owner';
  if not found then raise exception 'Member not found or access denied' using errcode = '42501'; end if;
end;
$$;
revoke all on function public.set_family_member_notes_access(uuid, uuid, text) from public, anon;
grant execute on function public.set_family_member_notes_access(uuid, uuid, text) to authenticated;

create function public.set_family_invite_notes_access(
  p_invite_id uuid, p_notes_access text
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_family uuid;
begin
  if auth.uid() is null then raise exception 'Sign in required' using errcode = '28000'; end if;
  if p_notes_access not in ('none', 'read', 'write') or p_notes_access is null then
    raise exception 'Invalid notes access' using errcode = '22023';
  end if;
  select family_id into v_family from public.family_invites
    where id = p_invite_id and accepted_at is null and revoked_at is null
      and expires_at > now() for update;
  if v_family is null or not private.has_family_role(v_family, array['owner']) then
    raise exception 'Invitation not found or access denied' using errcode = '42501';
  end if;
  update public.family_invites set notes_access = p_notes_access where id = p_invite_id;
end;
$$;
revoke all on function public.set_family_invite_notes_access(uuid, text) from public, anon;
grant execute on function public.set_family_invite_notes_access(uuid, text) to authenticated;
