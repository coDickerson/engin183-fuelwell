import { authConfigError, friendlyAuthError, getAuthenticatedUser, supabase } from './supabase.js';
import { DEMO_EMAIL, DEMO_PASSWORD, isDemoUser } from './demo.js';

const byId = (id) => document.getElementById(id);
const card = byId('auth-card');
const errorBox = byId('form-error');
const statusBox = byId('status');
const demoButton = byId('demo-button');
const matchKey = 'fuelwell.match.v1';
const MIN_PASSWORD = 8;
const DASHBOARD = '/dashboard.html';
const isDemoLink = new URLSearchParams(location.search).get('demo') === '1';

const views = [...document.querySelectorAll('.auth-view')];
const steps = [byId('quiz-step-1'), byId('quiz-step-2'), byId('account-step')];
const forms = {
  signIn: byId('sign-in-form'),
  signUp: byId('sign-up-form'),
  reset: byId('reset-form'),
  newPassword: byId('new-password-form'),
};
let recoveryInProgress = false;
let chosenRole = null;

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

/* ---------- Views and steps ---------- */

function showMode(mode, { focus = false } = {}) {
  card.dataset.mode = mode;
  for (const view of views) view.hidden = view.dataset.view !== mode;
  byId('show-sign-in').setAttribute('aria-pressed', String(mode === 'signIn'));
  byId('show-sign-up').setAttribute('aria-pressed', String(mode === 'signUp'));
  if (mode === 'signUp' && steps.every((step) => step.hidden)) showStep(1, { focus: false });
  if (focus) {
    const heading = mode === 'signUp'
      ? steps.find((step) => !step.hidden)?.querySelector('h2')
      : views.find((view) => view.dataset.view === mode)?.querySelector('h2');
    heading?.focus();
  }
}

function showStep(number, { focus = true } = {}) {
  steps.forEach((step, index) => { step.hidden = index + 1 !== number; });
  byId('step-count').textContent = `Step ${number} of ${steps.length}`;
  document.querySelectorAll('.step-track i').forEach((dot) => {
    dot.classList.toggle('is-done', Number(dot.dataset.step) <= number);
  });
  if (focus) steps[number - 1].querySelector('h2')?.focus();
}

/* ---------- Role (left panel) ---------- */

function applyRoleCopy(role) {
  document.querySelectorAll('[data-copy-caregiver]').forEach((node) => {
    node.textContent = role === 'patient' ? node.dataset.copyPatient : node.dataset.copyCaregiver;
  });
}

function setRole(role) {
  chosenRole = role;
  document.querySelectorAll('.role-card').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.role === role));
  });
  const radio = document.querySelector(`#quiz-step-1 input[name="role"][value="${role}"]`);
  if (radio) radio.checked = true;
  applyRoleCopy(role);
}

document.querySelectorAll('.role-card').forEach((button) => {
  button.addEventListener('click', () => {
    setRole(button.dataset.role);
    clearMessages();
    showMode('signUp');
    showStep(1);
    history.replaceState(null, '', '#sign-up');
  });
});

document.querySelectorAll('#quiz-step-1 input[name="role"]').forEach((radio) => {
  radio.addEventListener('change', () => setRole(radio.value));
});

/* ---------- Quiz result ---------- */

function readMatch() {
  try {
    const match = JSON.parse(sessionStorage.getItem(matchKey) || 'null');
    return match && ['patient', 'caregiver'].includes(match.role)
      && ['g3b', 'g4', 'unsure'].includes(match.stage)
      && ['familiar-meals', 'understand-options', 'prepare-conversation'].includes(match.goal)
      ? match : null;
  } catch { return null; }
}

async function saveMatch(user) {
  // The shared demo account keeps its curated sample data; never overwrite it.
  if (isDemoUser(user)) return;
  const match = readMatch();
  if (!match) return;
  const { error } = await supabase.from('quiz_results').upsert({
    user_id: user.id,
    role: match.role,
    stage: match.stage,
    goal: match.goal,
    has_traditions: Boolean(match.hasTraditions),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (error) throw new Error('Your account is ready, but your answers could not be saved. Please try again.');
}

async function finishAuthentication(user) {
  await saveMatch(user);
  location.assign(DASHBOARD);
}

const nextSteps = {
  'familiar-meals': 'List a few dishes you cook often. FuelWell will suggest kidney-friendly versions to discuss with a renal dietitian.',
  'understand-options': 'Start with the nutrient check on your dashboard, then bring questions to a renal dietitian or the care team.',
  'prepare-conversation': 'Write down the food questions you want to raise at the next care-team visit.',
};

byId('quiz-step-1').addEventListener('submit', (event) => {
  event.preventDefault();
  const answers = new FormData(event.currentTarget);
  if (!answers.get('role') || !answers.get('stage')) {
    showError('Please choose an answer for both questions.');
    return;
  }
  clearMessages();
  setRole(answers.get('role'));
  showStep(2);
});

byId('quiz-step-2').addEventListener('submit', (event) => {
  event.preventDefault();
  const first = new FormData(byId('quiz-step-1'));
  const second = new FormData(event.currentTarget);
  const role = first.get('role');
  const stage = first.get('stage');
  const goal = second.get('goal');
  if (!goal) {
    showError('Please choose what would help most.');
    return;
  }
  const hasTraditions = Boolean(String(second.get('traditions') || '').trim());
  const forWhom = role === 'caregiver' ? 'the person you care for' : 'you';
  const stageLine = stage === 'unsure'
    ? 'It’s fine not to know the kidney stage yet; the care team can confirm it.'
    : 'We’ll keep the plan in line with the stage the care team mentioned.';
  byId('result-intro').textContent = `We’ll start with meals for ${forWhom}`
    + (hasTraditions ? ', built around the foods that feel like home. ' : '. ') + stageLine;
  byId('result-next-step').textContent = nextSteps[goal];
  try { sessionStorage.setItem(matchKey, JSON.stringify({ role, stage, goal, hasTraditions })); }
  catch {
    showError('This browser could not keep your answers. Please allow site storage and try again.');
    return;
  }
  clearMessages();
  showStep(3);
});

document.querySelectorAll('.step-back').forEach((button) => {
  button.addEventListener('click', () => {
    clearMessages();
    showStep(Number(button.dataset.back));
  });
});

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
  withBusy(form, async () => {
    const { data, error } = await supabase.auth.signUp({
      email: byId('sign-up-email').value.trim(),
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
      showStatus('Almost done. Open the confirmation email we sent, then come back and sign in.');
      return;
    }
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Your account was created. Please sign in to open the dashboard.');
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
      location.assign(DASHBOARD);
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
    // Demo sign-in never saves quiz answers: go straight to the dashboard.
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
