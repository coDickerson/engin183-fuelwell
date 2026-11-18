// Run with: node --env-file=.env --env-file=.env.local backend/smoke-chat.mjs
// Uses the project's public fictional demo account. Never prints tokens.
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) throw new Error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
try {
  const { error: signInError } = await db.auth.signInWithPassword({
    email: 'heidi_demo@fuelwell.app', password: 'FuelwellDemo',
  });
  if (signInError) throw new Error(`Demo sign-in failed: ${signInError.message}`);

  const { data, error } = await db.functions.invoke('chat-agent', {
    body: { message: 'How can I use less sauce in chicken lo mein?', language: 'en' },
  });
  if (error) {
    const details = await error.context?.json?.().catch(() => null);
    throw new Error(`Chat request failed: ${details?.error || error.message}`);
  }
  if (typeof data?.text !== 'string' || !data.text.trim()) throw new Error('Chat returned no answer.');
  if (!['ai', 'rules'].includes(data.source)) throw new Error(`Unexpected answer source: ${data.source}`);
  if (!Array.isArray(data.citations)) throw new Error('Chat returned no citation list.');
  console.log(JSON.stringify({ ok: true, source: data.source, citations: data.citations.map((item) => item.id), answer: data.text }, null, 2));
} finally {
  await db.auth.signOut();
}
