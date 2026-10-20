import { authConfigError, friendlyAuthError, getAuthenticatedUser, supabase } from './supabase.js';
import { DEMO_EMAIL, DEMO_PASSWORD, isDemoUser } from './demo.js';

const byId = (id) => document.getElementById(id);
const card = byId('auth-card');
const errorBox = byId('form-error');
const statusBox = byId('status');
const demoButton = byId('demo-button');
const MIN_PASSWORD = 8;
const DASHBOARD = '/dashboard.html';
const FAMILY = '/family.html';
const isDemoLink = new URLSearchParams(location.search).get('demo') === '1';

const views = [...document.querySelectorAll('.auth-view')];
const forms = {
  signIn: byId('sign-in-form'),
  signUp: byId('sign-up-form'),
  reset: byId('reset-form'),
  newPassword: byId('new-password-form'),
};
let recoveryInProgress = false;

/* ---------- Messages ---------- */

function showError(message) {
  errorBox.textContent = message || '';
  errorBox.hidden = !message;
  if (message) statusBox.hidden = true;
}

function showStatus(message) {
  statusBox.textContent = message || '';
  statusBox.hidden = !message;
  if (message) errorBox.hidden = true;
}

function clearMessages() {
  showError('');
  showStatus('');
}

/* ---------- Views ---------- */

function showMode(mode, { focus = false } = {}) {
  card.dataset.mode = mode;
  for (const view of views) view.hidden = view.dataset.view !== mode;
  byId('show-sign-in').setAttribute('aria-pressed', String(mode === 'signIn'));
  byId('show-sign-up').setAttribute('aria-pressed', String(mode === 'signUp'));
  if (focus) {
    const heading = views.find((view) => view.dataset.view === mode)?.querySelector('h2');
    heading?.focus();
  }
}

async function finishAuthentication(user) {
  location.assign(isDemoUser(user) ? DASHBOARD : FAMILY);
}

/* ---------- Busy state ---------- */

async function withBusy(scope, action) {
  // Capture controls before any await; event.currentTarget is null afterwards.
  const controls = [...scope.querySelectorAll('button, input, textarea')];
  controls.forEach((control) => { control.disabled = true; });
  const submit = scope.querySelector('[type="submit"]');
  submit?.setAttribute('aria-busy', 'true');
  clearMessages();
  try { await action(); }
  catch (error) { showError(friendlyAuthError(error)); }
  finally {
    controls.forEach((control) => { control.disabled = false; });
    submit?.removeAttribute('aria-busy');
  }
}

function requireFields(form) {
  const empty = [...form.querySelectorAll('input[required]')].find((input) => !input.value.trim());
  if (empty) {
    showError(`Please fill in your ${empty.name === 'password' ? 'password' : 'email'}.`);
    empty.focus();
    return false;
  }
  const email = form.querySelector('input[type="email"]');
  if (email && !email.checkValidity()) {
    showError('Please check the email address. It doesn’t look quite right.');
    email.focus();
    return false;
  }
  return true;
}

/* ---------- Tabs and links ---------- */

byId('show-sign-in').addEventListener('click', () => {
  clearMessages();
  showMode('signIn');
  history.replaceState(null, '', '#sign-in');
});
byId('show-sign-up').addEventListener('click', () => {
  clearMessages();
  showMode('signUp');
  history.replaceState(null, '', '#sign-up');
});
byId('show-reset').addEventListener('click', () => {
  clearMessages();
  byId('reset-email').value = byId('sign-in-email').value;
  showMode('reset', { focus: true });
});
document.querySelector('.back-to-sign-in').addEventListener('click', () => {
  clearMessages();
  showMode('signIn', { focus: true });
});

document.querySelectorAll('.password-toggle').forEach((toggle) => {
  toggle.addEventListener('click', () => {
    const input = byId(toggle.getAttribute('aria-controls'));
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    toggle.textContent = show ? 'Hide' : 'Show';
    toggle.setAttribute('aria-pressed', String(show));
    toggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  });
});

/* ---------- Auth forms ---------- */

forms.signIn.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!supabase || !requireFields(form)) return;
  withBusy(form, async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: byId('sign-in-email').value.trim(),
      password: byId('sign-in-password').value,
    });
    if (error) throw error;
    const user = data.user;
    if (!user) throw new Error('We could not confirm your sign-in. Please try again.');
    form.reset();
    await finishAuthentication(user);
  });
});

forms.signUp.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!supabase || !requireFields(form)) return;
  const password = byId('sign-up-password').value;
  if (password.length < MIN_PASSWORD) {
    showError(`Please use a password with at least ${MIN_PASSWORD} characters.`);
    byId('sign-up-password').focus();
    return;
  }
  withBusy(form, async () => {
    const email = byId('sign-up-email').value.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: new URL('/start.html', location.origin).href },
    });
    if (error) throw error;
    // With "Confirm email" on, an existing address returns a user with no identities.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw new Error('You already have an account. Sign in instead.');
    }
    form.reset();
    if (!data.session) {
      showStatus('Almost done. Open the confirmation email we sent, then sign in to create or join a family.');
      return;
    }
    const user = data.user;
    if (!user) throw new Error('Your account was created. Please sign in to open your family space.');
    await finishAuthentication(user);
  });
});

forms.reset.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!supabase || !requireFields(form)) return;
  withBusy(form, async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(byId('reset-email').value.trim(), {
      redirectTo: new URL('/start.html', location.origin).href,
    });
    if (error) throw error;
    form.reset();
    showStatus('If this email has an account, a reset link is on its way.');
  });
});

forms.newPassword.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!supabase) return;
  const password = byId('new-password').value;
  if (password.length < MIN_PASSWORD) {
    showError(`Please use a password with at least ${MIN_PASSWORD} characters.`);
    byId('new-password').focus();
    return;
  }
  withBusy(form, async () => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    form.reset();
    recoveryInProgress = false;
    const user = await getAuthenticatedUser();
    if (user) {
      location.assign(isDemoUser(user) ? DASHBOARD : FAMILY);
      return;
    }
    showMode('signIn', { focus: true });
    showStatus('Password updated. Sign in to open your dashboard.');
  });
});

/* ---------- Demo ---------- */

function setDemoLoading(on) {
  document.documentElement.classList.toggle('is-demo-loading', on);
}

async function signInAsDemo() {
  if (!supabase) {
    setDemoLoading(false);
    showError('The demo isn’t available because sign-in is not configured on this copy of the site.');
    return;
  }
  demoButton.disabled = true;
  demoButton.setAttribute('aria-busy', 'true');
  setDemoLoading(true);
  clearMessages();
  try {
    const { error } = await supabase.auth.signInWithPassword({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
    if (error) throw error;
    // The shared demo account opens its curated dashboard.
    location.replace(DASHBOARD);
  } catch (error) {
    setDemoLoading(false);
    showMode('signIn');
    showError(/invalid login credentials/i.test(error?.message || '')
      ? 'The demo account isn’t available right now. Please try again later.'
      : friendlyAuthError(error, 'We couldn’t open the demo. Please try again.'));
    demoButton.disabled = false;
    demoButton.removeAttribute('aria-busy');
  }
}

byId('demo-email').textContent = DEMO_EMAIL;
byId('demo-password').textContent = DEMO_PASSWORD;
demoButton.addEventListener('click', signInAsDemo);

/* ---------- Startup ---------- */

if (authConfigError) {
  const notice = byId('config-notice');
  notice.hidden = false;
  notice.querySelector('.config-text').textContent = `${authConfigError} Use a browser-safe publishable key, never a service role key.`;
  card.querySelectorAll('form button, form input, #demo-button').forEach((control) => { control.disabled = true; });
}

if (supabase) {
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      recoveryInProgress = true;
      setTimeout(() => {
        clearMessages();
        showMode('newPassword', { focus: true });
      }, 0);
    }
  });
}

async function initialize() {
  if (location.hash === '#sign-up') showMode('signUp');
  else showMode('signIn');

  if (isDemoLink) {
    await signInAsDemo();
    return;
  }
  if (!supabase) return;
  // A recovery link carries type=recovery; let the PASSWORD_RECOVERY handler take over.
  if (/type=recovery/.test(location.hash)) return;
  try {
    const user = await getAuthenticatedUser();
    // Anyone already signed in (including after an email-confirmation redirect) goes to the dashboard.
    if (user && !recoveryInProgress) await finishAuthentication(user);
  } catch (error) {
    showError(friendlyAuthError(error, 'We could not check your account right now. Please try again.'));
  }
}

initialize();
