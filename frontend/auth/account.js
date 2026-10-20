import { authConfigError, friendlyAuthError, getAuthenticatedUser, signOutCurrentSession, supabase } from './supabase.js';
import { isDemoUser } from './demo.js';
import { loadProfile, saveProfile } from './profile.js';
import { accountT, setupAccountLanguage } from './account-i18n.js';
import { onLangChange } from '../scripts/i18n.js';

setupAccountLanguage();

const byId = (id) => document.getElementById(id);
const preview = import.meta.env.DEV && new URLSearchParams(location.search).get('preview') === '1';
let user;
let profile = null;
let goal = null;

function message(kind, text) {
  const target = byId(kind === 'error' ? 'account-error' : 'account-status');
  const other = byId(kind === 'error' ? 'account-status' : 'account-error');
  target.textContent = text;
  target.hidden = !text;
  if (text) other.hidden = true;
}

function displayName() {
  return profile?.fullName || String(user?.user_metadata?.full_name || '').trim() || 'there';
}

function paintSummary() {
  const name = displayName();
  byId('account-title').textContent = accountT('welcome', { name: name.split(' ')[0] });
  byId('summary-name').textContent = name === 'there' ? accountT('your_account') : name;
  byId('summary-email').textContent = user.email || '';
  byId('account-email').textContent = user.email || '';
  byId('summary-status').textContent = accountT(profile || goal ? 'preferences_started' : 'preferences_empty');
}
onLangChange(() => { if (user) paintSummary(); });

function paintForms() {
  byId('profile-name').value = profile?.fullName || String(user?.user_metadata?.full_name || '').trim();
  byId('profile-cuisine').value = profile?.cuisine || '';
  byId('condition-pressure').checked = Boolean(profile?.highBloodPressure);
  byId('condition-diabetes').checked = Boolean(profile?.diabetes);
  byId('condition-kidney').checked = Boolean(profile?.kidneyDisease);
  byId('profile-stage').value = profile?.stage || '';
  byId('goal-role').value = goal?.role || '';
  byId('goal-choice').value = goal?.goal || '';
  syncStage();
}

function scrollToPreferences() {
  if (location.hash === '#preferences') requestAnimationFrame(() => byId('preferences').scrollIntoView());
}

function syncStage() {
  const kidney = byId('condition-kidney').checked;
  byId('stage-field').hidden = !kidney;
  if (!kidney) byId('profile-stage').value = '';
}
byId('condition-kidney').addEventListener('change', syncStage);

async function loadGoal() {
  const { data, error } = await supabase.from('quiz_results')
    .select('role,stage,goal,has_traditions')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function busy(form, action) {
  const button = form.querySelector('[type="submit"]');
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  message('error', '');
  try { await action(); }
  catch (error) { message('error', friendlyAuthError(error, 'We could not save that yet. Please try again.')); }
  finally {
    button.disabled = false;
    button.removeAttribute('aria-busy');
  }
}

byId('profile-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const name = byId('profile-name').value.trim();
  if (!name) {
    message('error', accountT('name_required'));
    byId('profile-name').focus();
    return;
  }
  busy(form, async () => {
    const draft = {
      fullName: name,
      cuisine: byId('profile-cuisine').value,
      kidneyDisease: byId('condition-kidney').checked,
      stage: byId('profile-stage').value,
      highBloodPressure: byId('condition-pressure').checked,
      diabetes: byId('condition-diabetes').checked,
    };
    profile = preview ? draft : await saveProfile(user, draft);
    paintSummary();
    if (!preview && goal) {
      const { error } = await supabase.from('quiz_results').update({
        stage: profile.kidneyDisease ? (profile.stage === 'g3a' ? 'g3' : profile.stage) : null,
        has_traditions: Boolean(profile.cuisine),
        updated_at: new Date().toISOString(),
      }).eq('user_id', user.id);
      if (error) {
        message('error', accountT('goal_sync_error'));
        return;
      }
    }
    message('status', accountT(preview ? 'preview_saved' : 'preferences_saved'));
  });
});

byId('goal-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const role = byId('goal-role').value;
  const chosenGoal = byId('goal-choice').value;
  if (!role || !chosenGoal) {
    message('error', accountT('goal_required'));
    (!role ? byId('goal-role') : byId('goal-choice')).focus();
    return;
  }
  busy(form, async () => {
    if (!preview) {
      const { error } = await supabase.from('quiz_results').upsert({
        user_id: user.id,
        role,
        goal: chosenGoal,
        // quiz_results has the broader G3 value; profiles can keep G3a.
        stage: profile?.kidneyDisease ? (profile.stage === 'g3a' ? 'g3' : profile.stage) : null,
        has_traditions: Boolean(profile?.cuisine),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (error) throw error;
    }
    goal = { role, goal: chosenGoal };
    paintSummary();
    message('status', accountT(preview ? 'preview_saved' : 'goal_saved'));
  });
});

byId('sign-out').addEventListener('click', async () => {
  if (preview) { location.assign('/start.html#sign-in'); return; }
  const button = byId('sign-out');
  button.disabled = true;
  try {
    await signOutCurrentSession();
    location.replace('/start.html#sign-in');
  } catch (error) {
    button.disabled = false;
    message('error', friendlyAuthError(error, 'We could not sign you out. Please try again.'));
  }
});

async function initialize() {
  if (preview) {
    user = { email: 'alex@example.com', user_metadata: { full_name: 'Alex Rivera' } };
    byId('preview-notice').hidden = false;
    byId('account-loading').remove();
    byId('account-content').hidden = false;
    paintSummary();
    paintForms();
    scrollToPreferences();
    return;
  }
  if (authConfigError) { location.replace('/start.html#sign-in'); return; }
  try {
    user = await getAuthenticatedUser();
    if (!user) { location.replace('/start.html#sign-in'); return; }
    if (isDemoUser(user)) { location.replace('/demo-dashboard.html'); return; }
    // Name from sign-up metadata is display-only and survives email
    // confirmation in a different tab. Saving preferences creates a profile.
    // Show the account immediately; optional database reads can finish behind it.
    const preferenceControls = [...document.querySelectorAll('#profile-form input, #profile-form select, #profile-form button, #goal-form select, #goal-form button')];
    preferenceControls.forEach((control) => { control.disabled = true; });
    byId('account-loading').remove();
    byId('account-content').hidden = false;
    paintSummary();
    paintForms();
    scrollToPreferences();
    const results = await Promise.allSettled([loadProfile(user), loadGoal()]);
    if (results[0].status === 'fulfilled') profile = results[0].value;
    if (results[1].status === 'fulfilled') goal = results[1].value;
    paintSummary();
    paintForms();
    preferenceControls.forEach((control) => { control.disabled = false; });
    if (results.some((result) => result.status === 'rejected')) {
      message('error', 'Some saved preferences could not be loaded. You can still use this page and try again.');
    }
  } catch (error) {
    const text = friendlyAuthError(error, 'We could not open your account. Refresh the page to try again.');
    const loading = byId('account-loading');
    if (loading) loading.textContent = text;
    else message('error', text);
  }
}

initialize();
