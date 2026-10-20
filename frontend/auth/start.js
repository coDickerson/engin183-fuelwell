import { authConfigError, friendlyAuthError, getAuthenticatedUser, signOutCurrentSession, supabase } from './supabase.js';
import { isDemoUser } from './demo.js';
import { authT, setupAuthLanguage } from './auth-i18n.js';

setupAuthLanguage();

const byId = (id) => document.getElementById(id);
const card = byId('auth-card');
const errorBox = byId('form-error');
const statusBox = byId('status');
const MIN_PASSWORD = 8;
const DASHBOARD = '/dashboard.html';
const DEMO_DASHBOARD = '/demo-dashboard.html';
const views = [...document.querySelectorAll('.auth-view')];
const forms = {
  signIn: byId('sign-in-form'),
  signUp: byId('sign-up-form'),
  reset: byId('reset-form'),
  newPassword: byId('new-password-form'),
};
let recoveryInProgress = false;

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

function showMode(mode, { focus = false } = {}) {
  card.dataset.mode = mode;
  for (const view of views) view.hidden = view.dataset.view !== mode;
  byId('show-sign-in').setAttribute('aria-pressed', String(mode === 'signIn'));
  byId('show-sign-up').setAttribute('aria-pressed', String(mode === 'signUp'));
  if (focus) views.find((view) => view.dataset.view === mode)?.querySelector('h2')?.focus();
}

async function finishAuthentication(user) {
  if (isDemoUser(user)) {
    location.assign(DEMO_DASHBOARD);
    return;
  }
  location.assign(DASHBOARD);
}

async function withBusy(scope, action) {
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
    const label = { name: 'name', password: 'password', email: 'email' }[empty.name] || 'field';
    showError(`Please fill in your ${label}.`);
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
    toggle.textContent = authT(show ? 'hide' : 'show');
    toggle.setAttribute('aria-pressed', String(show));
    toggle.setAttribute('aria-label', authT(show ? 'hide_password' : 'show_password'));
  });
});

forms.signIn.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!supabase || !requireFields(form)) return;
  withBusy(form, async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: byId('sign-in-email').value.trim(),
      password: byId('sign-in-password').value,
    });
    if (error) throw error;
    const user = await getAuthenticatedUser();
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
  const fullName = byId('sign-up-name').value.trim().replace(/\s+/g, ' ').slice(0, 80);
  withBusy(form, async () => {
    const { data, error } = await supabase.auth.signUp({
      email: byId('sign-up-email').value.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: new URL('/start.html', location.origin).href,
        // Name is display data only; authorization never uses user metadata.
        data: { full_name: fullName },
      },
    });
    if (error) throw error;
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw new Error('You already have an account. Sign in instead.');
    }
    form.reset();
    if (!data.session) {
      showStatus('Almost done. Open the confirmation email we sent, then sign in. You can add preferences later.');
      return;
    }
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Your account was created. Please sign in to continue.');
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
    if (user) { await finishAuthentication(user); return; }
    showMode('signIn', { focus: true });
    showStatus('Password updated. Sign in to open your account.');
  });
});

if (authConfigError) {
  const notice = byId('config-notice');
  notice.hidden = false;
  notice.querySelector('.config-text').textContent = `${authConfigError} Use a browser-safe publishable key, never a service role key.`;
  card.querySelectorAll('form button, form input').forEach((control) => { control.disabled = true; });
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
  showMode(location.hash === '#sign-up' ? 'signUp' : 'signIn');
  if (!supabase || /type=recovery/.test(location.hash)) return;
  try {
    const user = await getAuthenticatedUser();
    if (!user || recoveryInProgress) return;
    // Visiting sign-in from the public demo must offer the person's own account.
    if (isDemoUser(user)) { await signOutCurrentSession(); return; }
    await finishAuthentication(user);
  } catch (error) {
    showError(friendlyAuthError(error, 'We could not check your account right now. Please try again.'));
  }
}

initialize();
