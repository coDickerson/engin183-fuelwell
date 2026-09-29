import { authConfigError, getAuthenticatedUser, supabase } from './supabase.js';

const byId = (id) => document.getElementById(id);
const accountPanel = byId('account-panel');
const quizPanel = byId('quiz-panel');
const resultPanel = byId('result-panel');
const status = byId('status');
const matchKey = 'fuelwell.match.v1';
const forms = {
  signUp: byId('sign-up-form'),
  signIn: byId('sign-in-form'),
  reset: byId('reset-form'),
  newPassword: byId('new-password-form'),
};
let recoveryInProgress = false;

function showStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle('is-error', isError);
  status.hidden = !message;
}

function showPanel(panel) {
  accountPanel.hidden = panel !== accountPanel;
  quizPanel.hidden = panel !== quizPanel;
  resultPanel.hidden = panel !== resultPanel;
}

function readMatch() {
  try {
    const match = JSON.parse(sessionStorage.getItem(matchKey) || 'null');
    return match && ['patient', 'caregiver'].includes(match.role)
      && ['g3b', 'g4', 'unsure'].includes(match.stage)
      && ['familiar-meals', 'understand-options', 'prepare-conversation'].includes(match.goal)
      ? match : null;
  } catch { return null; }
}

function showMode(mode) {
  showPanel(accountPanel);
  accountPanel.dataset.mode = mode;
  for (const [name, form] of Object.entries(forms)) form.hidden = name !== mode;
  byId('show-sign-up').classList.toggle('is-active', mode === 'signUp');
  byId('show-sign-up').setAttribute('aria-pressed', String(mode === 'signUp'));
  byId('show-sign-in').classList.toggle('is-active', mode === 'signIn');
  byId('show-sign-in').setAttribute('aria-pressed', String(mode === 'signIn'));
  byId('account-copy').textContent = readMatch()
    ? 'Your result is ready. Create an account or sign in to save it and open your dashboard.'
    : 'Sign in or create an account to open your dashboard.';
}

async function saveMatch(user) {
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
  if (error) throw new Error('Your account is ready, but the quiz result could not be saved. Please try again.');
}

async function finishAuthentication(user) {
  await saveMatch(user);
  location.assign('/dashboard.html');
}

async function withBusy(form, action) {
  const controls = [...form.querySelectorAll('button, input, textarea')];
  controls.forEach((control) => { control.disabled = true; });
  showStatus('');
  try { await action(); }
  catch (error) { showStatus(error?.message || 'Something went wrong. Please try again.', true); }
  finally { controls.forEach((control) => { control.disabled = false; }); }
}

byId('show-sign-up').addEventListener('click', () => {
  showStatus('');
  showMode('signUp');
  location.hash = 'sign-up';
});
byId('show-sign-in').addEventListener('click', () => {
  showStatus('');
  showMode('signIn');
  location.hash = 'sign-in';
});
byId('show-reset').addEventListener('click', () => {
  showStatus('');
  byId('reset-email').value = byId('sign-in-email').value;
  showMode('reset');
});
document.querySelector('.back-to-sign-in').addEventListener('click', () => {
  showStatus('');
  showMode('signIn');
});

forms.signUp.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!supabase) return;
  withBusy(forms.signUp, async () => {
    const { data, error } = await supabase.auth.signUp({
      email: byId('sign-up-email').value.trim(),
      password: byId('sign-up-password').value,
      options: { emailRedirectTo: new URL('/start.html', location.origin).href },
    });
    if (error) throw error;
    forms.signUp.reset();
    if (!data.session) {
      showStatus('Check your email for the confirmation link. Once confirmed, your result will be saved and your dashboard will open.');
      return;
    }
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Your account was created. Please sign in to open the dashboard.');
    await finishAuthentication(user);
  });
});

forms.signIn.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!supabase) return;
  withBusy(forms.signIn, async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: byId('sign-in-email').value.trim(),
      password: byId('sign-in-password').value,
    });
    if (error) throw error;
    forms.signIn.reset();
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('We could not confirm your sign-in. Please try again.');
    await finishAuthentication(user);
  });
});

forms.reset.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!supabase) return;
  withBusy(forms.reset, async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(byId('reset-email').value.trim(), {
      redirectTo: new URL('/start.html', location.origin).href,
    });
    if (error) throw error;
    forms.reset.reset();
    showStatus('If this email has an account, a password reset link is on its way.');
  });
});

forms.newPassword.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!supabase) return;
  withBusy(forms.newPassword, async () => {
    const { error } = await supabase.auth.updateUser({ password: byId('new-password').value });
    if (error) throw error;
    forms.newPassword.reset();
    recoveryInProgress = false;
    showMode('signIn');
    showStatus('Password updated. Sign in to open your dashboard.');
  });
});

const nextSteps = {
  'familiar-meals': 'Start by listing a few meals you enjoy. A qualified renal dietitian can help adapt familiar foods to your needs.',
  'understand-options': 'Bring your questions about food choices to a qualified renal dietitian or your care team.',
  'prepare-conversation': 'Write down the food questions you would like to discuss at your next care-team visit.',
};

byId('quiz-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const answers = new FormData(event.currentTarget);
  const role = answers.get('role');
  const stage = answers.get('stage');
  const goal = answers.get('goal');
  if (!role || !stage || !goal) return;
  const hasTraditions = Boolean(String(answers.get('traditions') || '').trim());
  const audience = role === 'caregiver' ? 'someone you care for' : 'you';
  const stageLine = stage === 'unsure'
    ? 'It is okay not to know the kidney stage yet. Your care team can help confirm it.'
    : 'A qualified care professional can help connect food decisions to the kidney stage your care team has discussed.';
  byId('result-intro').textContent = 'You are exploring support for ' + audience + '. ' +
    (hasTraditions ? 'The foods and traditions you value deserve a place in the conversation. ' : '') + stageLine;
  byId('result-next-step').textContent = nextSteps[goal];
  try { sessionStorage.setItem(matchKey, JSON.stringify({ role, stage, goal, hasTraditions })); }
  catch { showStatus('This browser could not keep your result. Please enable session storage and try again.', true); return; }
  showStatus('');
  showPanel(resultPanel);
  byId('result-heading').focus();
});

byId('save-result').addEventListener('click', async (event) => {
  event.currentTarget.disabled = true;
  try {
    const user = await getAuthenticatedUser();
    if (user) await finishAuthentication(user);
    else {
      showStatus('');
      showMode('signUp');
      location.hash = 'sign-up';
    }
  } catch (error) {
    showStatus(error?.message || 'We could not save your result. Please try again.', true);
  } finally { event.currentTarget.disabled = false; }
});

byId('retake-quiz').addEventListener('click', () => {
  showStatus('');
  showPanel(quizPanel);
});

if (authConfigError) {
  byId('config-notice').hidden = false;
  byId('config-notice').querySelector('p').textContent = authConfigError +
    ' Use a browser-safe publishable/anon key; never use a service role key.';
  accountPanel.querySelectorAll('form button, form input').forEach((control) => { control.disabled = true; });
}

if (supabase) {
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      recoveryInProgress = true;
      setTimeout(() => { showStatus(''); showMode('newPassword'); }, 0);
    }
  });
}

async function initialize() {
  if (location.hash === '#sign-in') showMode('signIn');
  else if (location.hash === '#sign-up') showMode('signUp');
  else showPanel(quizPanel);
  if (!supabase) return;
  try {
    const user = await getAuthenticatedUser();
    if (user && !recoveryInProgress) {
      if (readMatch()) await saveMatch(user);
      if (location.hash === '#sign-in' || location.hash === '#sign-up') location.assign('/dashboard.html');
    }
  } catch (error) {
    showStatus(error?.message || 'We could not check your account right now. Please try again.', true);
  }
}

initialize();
