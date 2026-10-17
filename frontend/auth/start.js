import { authConfigError, friendlyAuthError, getAuthenticatedUser, signOutCurrentSession, supabase } from './supabase.js';
import { isDemoUser } from './demo.js';
import { savePendingProfile, stashPendingProfile } from './profile.js';

const byId = (id) => document.getElementById(id);
const card = byId('auth-card');
const errorBox = byId('form-error');
const statusBox = byId('status');
const matchKey = 'fuelwell.match.v1';
const MIN_PASSWORD = 8;
const DASHBOARD = '/dashboard.html';

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

/* ---------- Health conditions (step 1) ---------- */

const CONDITIONS = ['high_blood_pressure', 'diabetes', 'kidney_disease'];
const STAGES = ['g1', 'g2', 'g3', 'g3b', 'g4', 'g5', 'g5d', 'unsure'];
const GOALS = ['familiar-meals', 'eat-healthier', 'fuel-performance', 'understand-options', 'prepare-conversation'];
const conditionBoxes = [...document.querySelectorAll('#conditions-set input[type="checkbox"]')];
const noneBox = document.querySelector('#conditions-set input[name="no_conditions"]');
const kidneyBox = document.querySelector('#conditions-set input[name="kidney_disease"]');
const stageSet = byId('stage-set');

function syncStage() {
  stageSet.hidden = !kidneyBox.checked;
  if (!kidneyBox.checked) stageSet.querySelectorAll('input').forEach((radio) => { radio.checked = false; });
}

// "None of these" and the conditions exclude each other.
conditionBoxes.forEach((box) => box.addEventListener('change', () => {
  if (!box.checked) { syncStage(); return; }
  if (box === noneBox) conditionBoxes.forEach((other) => { if (other !== noneBox) other.checked = false; });
  else noneBox.checked = false;
  syncStage();
}));

const chosenConditions = (form) => CONDITIONS.filter((name) => form.has(name));

/* ---------- Quiz result ---------- */

function readMatch() {
  try {
    const match = JSON.parse(sessionStorage.getItem(matchKey) || 'null');
    return match && ['patient', 'caregiver'].includes(match.role)
      && (match.stage === null || STAGES.includes(match.stage))
      && GOALS.includes(match.goal)
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
  if (!isDemoUser(user)) {
    // The dashboard asks for anything missing, so a failed profile save shouldn't block sign-in.
    try { await savePendingProfile(user); } catch { /* finished from the dashboard */ }
  }
  location.assign(DASHBOARD);
}

const nextSteps = {
  'familiar-meals': 'List a few dishes you cook often. FuelWell will suggest versions that fit, to discuss with a dietitian.',
  'eat-healthier': 'Start with this week’s plan on your dashboard and swap in the dishes you love.',
  'fuel-performance': 'Add your favourite dishes, and FuelWell will balance them for training and recovery.',
  'understand-options': 'Start with the nutrient check on your dashboard, then bring questions to a dietitian or the care team.',
  'prepare-conversation': 'Write down the food questions you want to raise at the next care-team visit.',
};

// What each condition means for the nutrient check, in plain words.
const conditionFocus = {
  high_blood_pressure: ['sodium'],
  diabetes: ['carbs', 'sugar'],
  kidney_disease: ['potassium', 'phosphorus', 'sodium'],
};

function joinWords(words) {
  return words.length < 2 ? words.join('') : `${words.slice(0, -1).join(', ')} and ${words.at(-1)}`;
}

byId('quiz-step-1').addEventListener('submit', (event) => {
  event.preventDefault();
  const answers = new FormData(event.currentTarget);
  if (!answers.get('role')) {
    showError('Please choose who you’re setting this up for.');
    return;
  }
  if (!chosenConditions(answers).length && !answers.has('no_conditions')) {
    showError('Please choose any that apply, or “None of these”.');
    return;
  }
  // The care-team visit goal only fits when there's a condition to discuss.
  const none = answers.has('no_conditions');
  document.querySelectorAll('#quiz-step-2 [data-needs-condition]').forEach((choice) => {
    choice.hidden = none;
    if (none) choice.querySelector('input').checked = false;
  });
  clearMessages();
  setRole(answers.get('role'));
  showStep(2);
});

document.querySelectorAll('.cuisine-pick').forEach((pick) => pick.addEventListener('click', () => {
  const input = byId('food-traditions');
  input.value = pick.textContent.trim();
  input.focus();
}));

byId('quiz-step-2').addEventListener('submit', (event) => {
  event.preventDefault();
  const first = new FormData(byId('quiz-step-1'));
  const second = new FormData(event.currentTarget);
  const role = first.get('role');
  const conditions = chosenConditions(first);
  const stage = conditions.includes('kidney_disease') ? (first.get('stage') || 'unsure') : null;
  const goal = second.get('goal');
  if (!goal) {
    showError('Please choose what would help most.');
    return;
  }
  const cuisine = String(second.get('traditions') || '').trim();
  const hasTraditions = Boolean(cuisine);
  const forWhom = role === 'caregiver' ? 'the person you care for' : 'you';
  const focus = conditions.length
    ? `Every dish gets a check for ${joinWords([...new Set(conditions.flatMap((c) => conditionFocus[c]))])}.`
    : goal === 'fuel-performance'
      ? 'Meals are balanced for energy, protein and recovery.'
      : 'Meals are balanced for everyday energy and health.';
  byId('result-intro').textContent = `We’ll start with ${cuisine ? `${cuisine} ` : ''}meals for ${forWhom}`
    + (hasTraditions ? ', built around the food that feels like home. ' : '. ') + focus;
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
    showError(`Please fill in your ${{ password: 'password', name: 'name' }[empty.name] || 'email'}.`);
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
  const quiz = new FormData(byId('quiz-step-1'));
  const profile = {
    fullName: byId('sign-up-name').value,
    cuisine: byId('food-traditions').value,
    kidneyDisease: quiz.has('kidney_disease'),
    stage: quiz.get('stage') || 'unsure',
    highBloodPressure: quiz.has('high_blood_pressure'),
    diabetes: quiz.has('diabetes'),
  };
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
    // Held in this tab until there is a session (right away, or after the confirmation email).
    stashPendingProfile(profile);
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

/* ---------- Startup ---------- */

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
  if (location.hash === '#sign-up') showMode('signUp');
  else showMode('signIn');

  if (!supabase) return;
  // A recovery link carries type=recovery; let the PASSWORD_RECOVERY handler take over.
  if (/type=recovery/.test(location.hash)) return;
  try {
    const user = await getAuthenticatedUser();
    if (!user || recoveryInProgress) return;
    // A leftover demo session must never stand in for someone's own sign-in: end it and show the form.
    if (isDemoUser(user)) {
      await signOutCurrentSession();
      return;
    }
    // Anyone else already signed in (including after an email-confirmation redirect) goes to the dashboard.
    await finishAuthentication(user);
  } catch (error) {
    showError(friendlyAuthError(error, 'We could not check your account right now. Please try again.'));
  }
}

initialize();
