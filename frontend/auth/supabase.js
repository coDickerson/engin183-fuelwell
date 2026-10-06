import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

function validProjectUrl(value) {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || (parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname));
  } catch {
    return false;
  }
}

export const authConfigError = !url || !key
  ? 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to configure account access.'
  : !validProjectUrl(url)
    ? 'VITE_SUPABASE_URL must be a valid Supabase project URL.'
    : null;

// Only a public, browser-safe publishable/anon key belongs in VITE_ variables.
export const supabase = authConfigError ? null : createClient(url, key);

export async function getAuthenticatedUser() {
  if (!supabase) return null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { data, error } = await supabase.auth.getUser();
    if (!error) {
      const user = data.user;
      return user?.email && !user.is_anonymous ? user : null;
    }
    if (error.name === 'AuthSessionMissingError' || error.status === 401) return null;
    if (attempt === 1) throw error;
  }
}

export async function signOutCurrentSession() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
}

// Turn raw Supabase Auth errors into plain-language messages for people, not developers.
const friendlyAuthMessages = [
  [/invalid login credentials|invalid_credentials/i, 'That email and password don’t match. Check for typos or reset your password.'],
  [/email not confirmed|email_not_confirmed/i, 'Please open the confirmation email we sent, then sign in.'],
  [/already registered|already been registered|user_already_exists|email_exists/i, 'You already have an account. Sign in instead.'],
  [/rate limit|too many requests|over_email_send_rate_limit|over_request_rate_limit/i, 'We’ve sent too many emails. Wait a few minutes or try the demo.'],
  [/email address not authorized|email_address_not_authorized/i, 'We can’t email that address yet. Try the demo account.'],
  [/password should be at least|weak_password|password is too short/i, 'Please use a password with at least 8 characters.'],
  [/unable to validate email|invalid format|email_address_invalid/i, 'Please check the email address. It doesn’t look quite right.'],
  [/failed to fetch|network|load failed/i, 'We couldn’t reach the server. Check your connection and try again.'],
];

export function friendlyAuthError(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback;
  if (error.status === 429) return friendlyAuthMessages[3][1];
  const text = [error.code, error.message].filter(Boolean).join(' ');
  for (const [pattern, message] of friendlyAuthMessages) if (pattern.test(text)) return message;
  // Errors thrown by our own code are already plain language; raw Supabase errors are not.
  const fromSupabase = error.status || error.code || error.__isAuthError || /^Auth/.test(error.name || '');
  return !fromSupabase && error.message ? error.message : fallback;
}
