// /demo: signs in to the shared demo account and opens the dashboard as Heidi.
// Kept apart from /start.html so a demo session never stands in for someone's own sign-in.
import { authConfigError, friendlyAuthError, supabase } from './supabase.js';
import { DEMO_EMAIL, DEMO_PASSWORD } from './demo.js';
import { setDemoSession, track } from '../scripts/track.js';

// /demo?to=meals opens a page other than Today (only these, never an outside URL).
const PAGES = { today: '/dashboard.html', meals: '/meals.html#ask', browse: '/meals.html#browse', notes: '/notes.html', chat: '/ai-chat.html' };
const next = PAGES[new URLSearchParams(location.search).get('to')] || PAGES.today;

const byId = (id) => document.getElementById(id);
const opening = byId('demo-opening');
const failed = byId('demo-failed');

function showFailure(message) {
  opening.hidden = true;
  failed.hidden = false;
  byId('demo-error').textContent = message;
  failed.querySelector('h1').focus();
}

async function openDemo() {
  opening.hidden = false;
  failed.hidden = true;
  if (!supabase) {
    showFailure(authConfigError
      ? 'The demo isn’t available because sign-in is not configured on this copy of the site.'
      : 'The demo isn’t available right now. Please try again later.');
    return;
  }
  try {
    const { error } = await supabase.auth.signInWithPassword({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
    if (error) throw error;
    setDemoSession(true);
    track('demo_open');
    location.replace(next);
  } catch (error) {
    showFailure(/invalid login credentials/i.test(error?.message || '')
      ? 'The demo account isn’t available right now. Please try again later.'
      : friendlyAuthError(error, 'We couldn’t open the demo. Please try again.'));
  }
}

byId('demo-retry').addEventListener('click', openDemo);
openDemo();
