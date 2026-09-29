import { authConfigError, getAuthenticatedUser, signOutCurrentSession, supabase } from './supabase.js';

const byId = (id) => document.getElementById(id);
const accountPanel = byId('account-panel');
const quizPanel = byId('quiz-panel');
const resultPanel = byId('result-panel');
const status = byId('status');
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

function showMode(mode) {
  showPanel(accountPanel);
  accountPanel.dataset.mode = mode;
  for (const [name, form] of Object.entries(forms)) form.hidden = name !== mode;
  const isSignIn = mode === 'signIn';
  byId('show-sign-up').classList.toggle('is-active', mode === 'signUp');
  byId('show-sign-up').setAttribute('aria-pressed', String(mode === 'signUp'));
  byId('show-sign-in').classList.toggle('is-active', isSignIn);
  byId('show-sign-in').setAttribute('aria-pressed', String(isSignIn));
}

function showQuiz(user) {
  if (!user) return;
  byId('signed-in-as').textContent = user.email ? 'Signed in as ' + user.email : 'You are signed in.';
  showStatus('');
  showPanel(quizPanel);
}

async function refreshUser() {
  if (!supabase || recoveryInProgress) return;
  try {
    const user = await getAuthenticatedUser();
    if (user) showQuiz(user);
    else showMode(location.hash === '#sign-in' ? 'signIn' : 'signUp');
  } catch {
    showMode('signIn');
    showStatus('We could not check your account right now. Please try signing in again.', true);
  }
}

async function withBusy(form, action) {
  const controls = [...form.querySelectorAll('button, input, textarea')];
  controls.forEach((control) => { control.disabled = true; });
  showStatus('');
  try {
    await action();
  } catch (error) {
    showStatus(error?.message || 'Something went wrong. Please try again.', true);
  } finally {
    controls.forEach((control) => { control.disabled = false; });
  }
}

byId('show-sign-up').addEventListener('click', () => {
  showStatus('');
  showMode('signUp');
  if (location.hash) history.replaceState(null, '', location.pathname);
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
    const email = byId('sign-up-email').value.trim();
    const password = byId('sign-up-password').value;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: new URL('/start.html', location.origin).href },
    });
    if (error) throw error;
    forms.signUp.reset();
    if (data.session) {
      const user = await getAuthenticatedUser();
      if (user) showQuiz(user);
      else showStatus('Your account was created. Please sign in to continue.');
    } else {
      showStatus('Check your email for a confirmation link. After confirming, return here to take the quiz.');
    }
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
    showQuiz(user);
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
    showStatus('Password updated. Sign in to continue to the quiz.');
  });
});

byId('sign-out').addEventListener('click', async () => {
  try {
    await signOutCurrentSession();
    sessionStorage.removeItem('fuelwell.match.v1');
    byId('quiz-form').reset();
    showMode('signIn');
    showStatus('You have signed out.');
  } catch {
    showStatus('We could not sign you out. Please try again.', true);
  }
});

const nextSteps = {
  'familiar-meals': 'Start by listing a few meals you enjoy. A qualified renal dietitian can help adapt familiar foods to your needs.',
  'understand-options': 'Bring your questions about food choices to a qualified renal dietitian or your care team.',
  'prepare-conversation': 'Write down the food questions you would like to discuss at your next care-team visit.',
};

byId('quiz-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      showMode('signIn');
      showStatus('Please sign in again before continuing.', true);
      return;
    }
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
    // The dashboard team can read this same-origin, session-only summary during integration.
    try {
      sessionStorage.setItem('fuelwell.match.v1', JSON.stringify({ role, stage, goal, hasTraditions }));
    } catch {
      // The result still works when browser storage is unavailable.
    }
    showStatus('');
    showPanel(resultPanel);
    byId('result-heading').focus();
  } catch {
    showStatus('We could not confirm your sign-in. Please try again.', true);
    showMode('signIn');
  }
});

byId('retake-quiz').addEventListener('click', async () => {
  const user = await getAuthenticatedUser().catch(() => null);
  if (user) showQuiz(user);
  else {
    showMode('signIn');
    showStatus('Please sign in again before continuing.', true);
  }
});

window.addEventListener('hashchange', () => {
  if (location.hash === '#sign-in' && !recoveryInProgress && !accountPanel.hidden) showMode('signIn');
});

if (authConfigError) {
  byId('config-notice').hidden = false;
  byId('config-notice').querySelector('p').textContent = authConfigError +
    ' Use a browser-safe publishable/anon key; never use a service role key.';
  accountPanel.querySelectorAll('form button, form input').forEach((control) => { control.disabled = true; });
  showMode(location.hash === '#sign-in' ? 'signIn' : 'signUp');
} else {
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      recoveryInProgress = true;
      setTimeout(() => { showStatus(''); showMode('newPassword'); }, 0);
    } else if (event === 'SIGNED_OUT') {
      setTimeout(() => {
        sessionStorage.removeItem('fuelwell.match.v1');
        showMode('signIn');
      }, 0);
    }
  });
  showMode(location.hash === '#sign-in' ? 'signIn' : 'signUp');
  refreshUser();
}
