import { authConfigError, friendlyAuthError, getAuthenticatedUser, signOutCurrentSession, supabase } from './supabase.js';
import { isDemoUser } from './demo.js';

const byId = (id) => document.getElementById(id);
const PENDING_INVITE = 'fuelwell.pendingInvite.v1';
let user;
let memberships = [];
let selectedFamilyId = null;
let detailGeneration = 0;
const notesAccessLabels = {
  none: 'No notes access',
  read: 'Read notes only',
  write: 'Read and add notes',
};

function message(kind, text) {
  const target = byId(kind === 'error' ? 'family-error' : 'family-status');
  const other = byId(kind === 'error' ? 'family-status' : 'family-error');
  target.textContent = text;
  target.hidden = !text;
  other.hidden = true;
  if (text) target.scrollIntoView({ block: 'nearest' });
}

function cleanError(error, fallback) {
  if (error?.code === 'PGRST205' || /could not find the table|could not find the function/i.test(error?.message || '')) {
    return 'Family access is not set up on this server yet. Please contact the FuelWell team.';
  }
  if (/invitation is invalid, expired, or for another email/i.test(error?.message || '')) {
    return 'This invitation has expired, was already used, or belongs to another email address.';
  }
  if (/confirmed, permanent account is required|confirm your email/i.test(error?.message || '')) {
    return 'Confirm your account email before joining or creating a family.';
  }
  return friendlyAuthError(error, fallback);
}

async function busy(form, action) {
  const controls = [...form.querySelectorAll('button, input, select, textarea')];
  controls.forEach((control) => { control.disabled = true; });
  try { await action(); }
  catch (error) { message('error', cleanError(error, 'We could not save that change. Please try again.')); }
  finally { controls.forEach((control) => { control.disabled = false; }); }
}

function invitationFromUrl() {
  const hash = new URLSearchParams(location.hash.slice(1));
  const token = hash.get('invite');
  if (token) {
    try { sessionStorage.setItem(PENDING_INVITE, token); } catch { /* Browser storage may be unavailable. */ }
    history.replaceState(null, '', location.pathname);
  }
  try { return token || sessionStorage.getItem(PENDING_INVITE); }
  catch { return token; }
}

async function loadQuizSummary() {
  const { data, error } = await supabase.from('quiz_results')
    .select('role,stage,goal,has_traditions')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error || !data) return;
  byId('quiz-role').value = data.role;
  byId('quiz-stage').value = data.stage;
  byId('quiz-goal').value = data.goal;
  byId('quiz-traditions').checked = Boolean(data.has_traditions);
  const labels = [
    ['For', { caregiver: 'Someone I care for', patient: 'Myself' }[data.role]],
    ['Kidney stage', { g3: 'G3', g3b: 'G3b', g4: 'G4', unsure: 'Not sure yet' }[data.stage]],
    ['Main goal', { 'familiar-meals': 'Plan familiar meals', 'understand-options': 'Understand food options', 'prepare-conversation': 'Prepare for a care visit' }[data.goal]],
    ['Food traditions', data.has_traditions ? 'Included in your answers' : 'Not specified'],
  ];
  const list = byId('quiz-summary');
  list.replaceChildren();
  for (const [term, value] of labels) {
    if (!value) continue;
    const entry = document.createElement('div');
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = term;
    dd.textContent = value;
    entry.append(dt, dd);
    list.append(entry);
  }
  list.hidden = false;
  byId('quiz-details-label').textContent = 'Edit your starting point (optional)';
}

byId('quiz-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  busy(form, async () => {
    const { error } = await supabase.from('quiz_results').upsert({
      user_id: user.id,
      role: byId('quiz-role').value,
      stage: byId('quiz-stage').value,
      goal: byId('quiz-goal').value,
      has_traditions: byId('quiz-traditions').checked,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    if (error) throw error;
    await loadQuizSummary();
    byId('quiz-details').open = false;
    message('status', 'Your starting point was saved to your account.');
  });
});

async function loadFamilies(preferredId = selectedFamilyId) {
  const { data, error } = await supabase.from('family_members')
    .select('family_id,role,notes_access,families(id,name)')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: true });
  if (error) throw error;
  memberships = data || [];
  const list = byId('family-list');
  list.replaceChildren();
  byId('family-empty').hidden = memberships.length > 0;
  for (const membership of memberships) {
    if (!membership.families) continue;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'family-choice';
    button.dataset.familyId = membership.family_id;
    const name = document.createElement('strong');
    name.textContent = membership.families.name;
    const role = document.createElement('small');
    role.textContent = membership.role;
    button.append(name, role);
    button.addEventListener('click', () => selectFamily(membership.family_id));
    list.append(button);
  }
  byId('family-loading').hidden = true;
  byId('family-content').hidden = false;
  const next = memberships.some((entry) => entry.family_id === preferredId)
    ? preferredId : memberships[0]?.family_id;
  if (next) await selectFamily(next);
  else {
    selectedFamilyId = null;
    byId('family-detail').hidden = true;
    byId('family-placeholder').hidden = false;
  }
}

async function selectFamily(familyId) {
  const membership = memberships.find((entry) => entry.family_id === familyId);
  if (!membership) return;
  selectedFamilyId = familyId;
  const generation = ++detailGeneration;
  document.querySelectorAll('.family-choice').forEach((button) => {
    button.setAttribute('aria-current', String(button.dataset.familyId === familyId));
  });
  byId('family-placeholder').hidden = true;
  byId('family-detail').hidden = false;
  byId('detail-title').textContent = membership.families.name;
  byId('my-role').textContent = `Your role: ${membership.role} · ${notesAccessLabels[membership.notes_access]}`;
  byId('invite-section').hidden = membership.role !== 'owner';
  byId('invite-result').hidden = true;
  byId('note-form').hidden = membership.notes_access !== 'write';
  byId('member-list').replaceChildren();
  byId('note-list').textContent = 'Loading shared information…';
  const [membersResult, notesResult, invitesResult, memberEmailsResult] = await Promise.all([
    supabase.from('family_members').select('user_id,role,notes_access,joined_at').eq('family_id', familyId).order('joined_at'),
    membership.notes_access !== 'none'
      ? supabase.from('family_records').select('id,payload,created_at').eq('family_id', familyId).eq('record_type', 'note').order('created_at', { ascending: false }).limit(50)
      : Promise.resolve({ data: [] }),
    membership.role === 'owner'
      ? supabase.from('family_invites').select('id,email,role,notes_access,expires_at').eq('family_id', familyId).is('accepted_at', null).is('revoked_at', null).gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    membership.role === 'owner'
      ? supabase.rpc('list_family_member_emails', { p_family_id: familyId })
      : Promise.resolve({ data: [] }),
  ]);
  if (generation !== detailGeneration) return;
  if (membersResult.error || notesResult.error || invitesResult.error || memberEmailsResult.error) {
    message('error', cleanError(membersResult.error || notesResult.error || invitesResult.error || memberEmailsResult.error, 'We could not load this family’s shared information.'));
    return;
  }
  const memberEmails = new Map((memberEmailsResult.data || []).map((entry) => [entry.user_id, entry.email]));
  for (const member of membersResult.data || []) {
    const item = document.createElement('li');
    const person = document.createElement('strong');
    const verifiedEmail = memberEmails.get(member.user_id);
    person.textContent = member.user_id === user.id
      ? 'You'
      : membership.role === 'owner' && verifiedEmail ? verifiedEmail : 'Family member';
    const role = document.createElement('span');
    role.textContent = member.role;
    const details = document.createElement('div');
    details.append(role);
    if (membership.role === 'owner' && member.role !== 'owner') {
      const accessLabel = document.createElement('label');
      accessLabel.className = 'member-access';
      accessLabel.textContent = 'Shared notes: ';
      const access = document.createElement('select');
      access.setAttribute('aria-label', `Shared notes access for ${verifiedEmail || 'family member'}`);
      for (const [value, label] of Object.entries(notesAccessLabels)) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        access.append(option);
      }
      access.value = member.notes_access;
      access.addEventListener('change', async () => {
        access.disabled = true;
        const { error } = await supabase.rpc('set_family_member_notes_access', {
          p_family_id: familyId,
          p_user_id: member.user_id,
          p_notes_access: access.value,
        });
        if (error) {
          access.value = member.notes_access;
          access.disabled = false;
          message('error', cleanError(error, 'We could not change this member’s access.'));
          return;
        }
        member.notes_access = access.value;
        access.disabled = false;
        message('status', `Shared notes access changed to ${notesAccessLabels[access.value].toLowerCase()}.`);
      });
      accessLabel.append(access);
      details.append(accessLabel);
    } else {
      const access = document.createElement('small');
      access.textContent = notesAccessLabels[member.notes_access];
      details.append(access);
    }
    if (membership.role === 'owner' && member.user_id !== user.id && verifiedEmail) {
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Remove';
      remove.setAttribute('aria-label', `Remove ${person.textContent} from ${membership.families.name}`);
      remove.addEventListener('click', async () => {
        if (!confirm(`Remove ${person.textContent} from ${membership.families.name}? They will lose access to its shared notes.`)) return;
        remove.disabled = true;
        const { error } = await supabase.rpc('remove_family_member', { p_family_id: familyId, p_user_id: member.user_id });
        if (error) { remove.disabled = false; message('error', cleanError(error, 'We could not remove this member.')); return; }
        await selectFamily(familyId);
        message('status', 'Family member removed.');
      });
      details.append(remove);
    }
    item.append(person, details);
    byId('member-list').append(item);
  }
  const inviteList = byId('invite-list');
  inviteList.replaceChildren();
  byId('pending-invites').hidden = !invitesResult.data?.length;
  for (const invite of invitesResult.data || []) {
    const item = document.createElement('li');
    const address = document.createElement('strong');
    address.textContent = invite.email;
    const details = document.createElement('div');
    const role = document.createElement('span');
    role.textContent = invite.role;
    const accessLabel = document.createElement('label');
    accessLabel.className = 'member-access';
    accessLabel.textContent = 'Shared notes: ';
    const access = document.createElement('select');
    access.setAttribute('aria-label', `Shared notes access for invitation to ${invite.email}`);
    for (const [value, label] of Object.entries(notesAccessLabels)) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      access.append(option);
    }
    access.value = invite.notes_access;
    access.addEventListener('change', async () => {
      access.disabled = true;
      const { error } = await supabase.rpc('set_family_invite_notes_access', {
        p_invite_id: invite.id,
        p_notes_access: access.value,
      });
      if (error) {
        access.value = invite.notes_access;
        access.disabled = false;
        message('error', cleanError(error, 'We could not change this invitation’s access.'));
        return;
      }
      invite.notes_access = access.value;
      access.disabled = false;
      message('status', `Invitation access changed to ${notesAccessLabels[access.value].toLowerCase()}.`);
    });
    accessLabel.append(access);
    const revoke = document.createElement('button');
    revoke.type = 'button';
    revoke.textContent = 'Revoke';
    revoke.setAttribute('aria-label', `Revoke invitation for ${invite.email}`);
    revoke.addEventListener('click', async () => {
      revoke.disabled = true;
      const { error } = await supabase.rpc('revoke_family_invite', { p_invite_id: invite.id });
      if (error) { revoke.disabled = false; message('error', cleanError(error, 'We could not revoke this invitation.')); return; }
      await selectFamily(familyId);
      message('status', `Invitation for ${invite.email} revoked.`);
    });
    details.append(role, accessLabel, revoke);
    item.append(address, details);
    inviteList.append(item);
  }
  const notes = byId('note-list');
  notes.replaceChildren();
  if (membership.notes_access === 'none') {
    const locked = document.createElement('p');
    locked.className = 'muted';
    locked.textContent = 'The family owner has not enabled shared notes for your account.';
    notes.append(locked);
  } else if (!notesResult.data?.length) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = 'No shared notes yet.';
    notes.append(empty);
  }
  for (const record of notesResult.data || []) {
    const note = document.createElement('p');
    note.className = 'note';
    note.textContent = typeof record.payload?.text === 'string' ? record.payload.text : '';
    const date = document.createElement('time');
    date.dateTime = record.created_at;
    date.textContent = new Date(record.created_at).toLocaleString();
    note.append(date);
    notes.append(note);
  }
}

byId('create-family-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const name = byId('family-name').value.trim();
  if (!name) return;
  busy(form, async () => {
    const { data, error } = await supabase.rpc('create_family', { p_name: name });
    if (error) throw error;
    form.reset();
    await loadFamilies(data);
    message('status', `${name} is ready. You can invite family members now.`);
  });
});

async function acceptInvite(token) {
  const { data, error } = await supabase.rpc('accept_family_invite', { p_token: token });
  if (error) throw error;
  try { sessionStorage.removeItem(PENDING_INVITE); } catch { /* Storage unavailable. */ }
  byId('join-family-form').reset();
  await loadFamilies(data);
  message('status', 'You joined the family. Its shared notes are now available to you.');
}

byId('join-family-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const token = byId('invite-token').value.trim();
  if (!token) return;
  busy(form, () => acceptInvite(token));
});

byId('invite-family-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!selectedFamilyId) return;
  busy(form, async () => {
    const email = byId('member-email').value.trim().toLowerCase();
    if (!byId('member-email').checkValidity()) throw new Error('Please enter a valid email address.');
    const { data, error } = await supabase.rpc('invite_family_member', {
      p_family_id: selectedFamilyId,
      p_email: email,
      p_role: byId('member-role').value,
      p_notes_access: byId('invite-notes-access').value,
    });
    if (error) throw error;
    const link = new URL('/family.html', location.origin);
    link.hash = new URLSearchParams({ invite: data }).toString();
    byId('invite-link').value = link.href;
    byId('invite-result').hidden = false;
    await selectFamily(selectedFamilyId);
    byId('invite-result').hidden = false;
    message('status', `Invitation created for ${email}. Copy the link and send it privately.`);
  });
});

byId('member-role').addEventListener('change', () => {
  byId('invite-notes-access').value = byId('member-role').value === 'viewer' ? 'read' : 'write';
});

byId('copy-invite').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(byId('invite-link').value);
    message('status', 'Invitation link copied.');
  } catch {
    byId('invite-link').select();
    message('status', 'Select and copy the invitation link.');
  }
});

byId('note-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const text = byId('note-text').value.trim();
  if (!selectedFamilyId || !text) return;
  busy(form, async () => {
    const { error } = await supabase.from('family_records').insert({
      family_id: selectedFamilyId,
      record_type: 'note',
      payload: { text },
    });
    if (error) throw error;
    form.reset();
    await selectFamily(selectedFamilyId);
    message('status', 'Your note is shared with this family.');
  });
});

byId('sign-out').addEventListener('click', async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  try {
    await signOutCurrentSession();
    location.replace('/start.html#sign-in');
  } catch {
    button.disabled = false;
    message('error', 'We could not sign you out. Please try again.');
  }
});

async function initialize() {
  const invitation = invitationFromUrl();
  if (authConfigError) {
    byId('family-loading').textContent = authConfigError;
    return;
  }
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    user = data.session?.user;
  }
  catch (error) { message('error', cleanError(error, 'We could not check your account.')); }
  if (!user?.email || user.is_anonymous) {
    location.replace('/start.html#sign-in');
    return;
  }
  // The data requests below still use Supabase RLS. Verify the browser session
  // in parallel so a network round trip does not block the page shell.
  getAuthenticatedUser().then((verified) => {
    if (!verified || verified.id !== user.id) location.replace('/start.html#sign-in');
  }).catch(() => { /* Data requests show their own connection errors. */ });
  if (isDemoUser(user)) {
    location.replace('/dashboard.html');
    return;
  }
  byId('account-email').textContent = user.email;
  try {
    await Promise.all([loadQuizSummary(), loadFamilies()]);
    if (invitation) {
      byId('invite-token').value = invitation;
      await acceptInvite(invitation);
    }
  } catch (error) {
    byId('family-loading').hidden = true;
    message('error', cleanError(error, 'We could not load your families. Please refresh and try again.'));
  }
}

initialize();
