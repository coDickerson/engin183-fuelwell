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
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    if (error.name === 'AuthSessionMissingError' || error.status === 401) return null;
    throw error;
  }
  const user = data.user;
  return user?.email && !user.is_anonymous ? user : null;
}

export async function signOutCurrentSession() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
}
