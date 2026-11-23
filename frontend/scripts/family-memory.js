// Family memory and answer feedback (tables family_memory and answer_feedback).
//
// Memory = short preference notes from the family's own clicks: "We'll try it" / "Not for us" on a
// swap, and the dishes they asked about. The newest few travel with each Ask FuelWell request
// (profile.memory) so later answers build on them. Preferences only, never medical facts.
// Real accounts keep memory in the database (only the owner can read it). The demo account is
// shared by every visitor, so its memory stays in this browser tab (sessionStorage).
import { supabase } from '../auth/supabase.js';
import { isDemoSession } from './track.js';

const DEMO_KEY = 'fuelwell.demo.memory';
const MAX_IN_PROMPT = 8;
// How each kind is written into the AI prompt (English, since the prompt is English).
const PROMPT_LABEL = { tried: 'Will try', not_for_us: 'Not for us', asked: 'Asked about' };

let cache = null; // [{ id, kind, text, created_at }], newest first

const clip = (s, n = 140) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

function demoRead() {
  try { return JSON.parse(sessionStorage.getItem(DEMO_KEY) || '[]'); } catch { return []; }
}
function demoWrite(list) {
  try { sessionStorage.setItem(DEMO_KEY, JSON.stringify(list.slice(0, 40))); } catch { /* storage unavailable */ }
}

/** All notes for this account, newest first. Cached after the first load. */
export async function loadMemory() {
  if (cache) return cache;
  if (isDemoSession() || !supabase) { cache = demoRead(); return cache; }
  const { data, error } = await supabase.from('family_memory').select('id,kind,text,created_at').order('created_at', { ascending: false }).limit(40);
  cache = error ? [] : data;
  return cache;
}

/** Adds (or refreshes) a note. A "tried" note replaces a "not for us" note for the same swap, and the other way round. */
export async function remember(kind, text) {
  const value = clip(text);
  if (!value || !PROMPT_LABEL[kind]) return;
  const list = await loadMemory();
  const opposite = kind === 'tried' ? 'not_for_us' : kind === 'not_for_us' ? 'tried' : null;
  const stale = list.filter((m) => m.text === value && (m.kind === kind || m.kind === opposite));
  for (const m of stale) await forget(m.id);
  const note = { id: `local-${Date.now()}`, kind, text: value, created_at: new Date().toISOString() };
  if (isDemoSession() || !supabase) {
    cache = [note, ...cache];
    demoWrite(cache);
    return;
  }
  const { data, error } = await supabase.from('family_memory').insert({ kind, text: value }).select('id,kind,text,created_at').single();
  if (!error && data) cache = [data, ...cache];
}

export async function forget(id) {
  if (!cache) await loadMemory();
  cache = cache.filter((m) => m.id !== id);
  if (isDemoSession() || !supabase || String(id).startsWith('local-')) { demoWrite(cache); return; }
  await supabase.from('family_memory').delete().eq('id', id);
}

/** The current state of one swap: 'tried', 'not_for_us' or null. */
export function swapChoice(text) {
  const m = (cache || []).find((x) => x.text === clip(text) && (x.kind === 'tried' || x.kind === 'not_for_us'));
  return m ? m.kind : null;
}

/** The newest notes, written for the AI prompt (profile.memory). */
export function memoryForPrompt() {
  return (cache || []).slice(0, MAX_IN_PROMPT).map((m) => `${PROMPT_LABEL[m.kind]}: ${m.text}`);
}

/** Thumbs up/down under an answer. Best effort: a failed save never interrupts the person. */
export async function sendFeedback({ mode, question, answerTitle, rating, reason = null }) {
  if (!supabase) return false;
  const { error } = await supabase.from('answer_feedback').insert({
    mode,
    question: clip(question, 300) || null,
    answer_title: clip(answerTitle, 200) || null,
    rating,
    reason,
    is_demo: isDemoSession(),
  });
  return !error;
}
