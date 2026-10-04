// Browser client for FuelWell's AI Edge Functions (supabase/functions/*).
// Signatures and return shapes below are the contract the dashboard UI relies on.
// The functions always return one of these shapes on success: when the model is
// unavailable they answer from a deterministic rules engine with source: 'rules'.
import { supabase } from '../auth/supabase.js';

const FRIENDLY = {
  not_configured: 'The AI helpers are not set up on this copy of FuelWell yet.',
  not_signed_in: 'Please sign in again to use this helper.',
  rate_limited: "You've reached today's limit for AI requests. Please try again tomorrow.",
  offline: 'You appear to be offline. Check your connection and try again.',
  timeout: 'That took too long. Please try again in a moment.',
  generic: 'The helper could not answer just now. Please try again.',
};

const TIMEOUT_MS = 60_000;

/** Turn a functions.invoke error into a friendly Error with a `code`. */
async function friendlyError(error) {
  const status = error?.context?.status;
  let body = null;
  try {
    if (error?.context && typeof error.context.json === 'function') body = await error.context.json();
  } catch {
    body = null;
  }
  let code = 'generic';
  let message = FRIENDLY.generic;
  if (status === 401 || status === 403 || body?.code === 'not_signed_in') {
    code = 'not_signed_in'; message = FRIENDLY.not_signed_in;
  } else if (status === 429 || body?.code === 'rate_limited') {
    code = 'rate_limited'; message = body?.error || FRIENDLY.rate_limited;
  } else if (status === 400 && body?.error) {
    code = 'bad_input'; message = body.error;
  } else if (error?.name === 'FunctionsFetchError' || error?.name === 'FunctionsRelayError') {
    code = typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'generic';
    message = FRIENDLY[code];
  }
  const err = new Error(message);
  err.code = code;
  return err;
}

async function invoke(name, body) {
  if (!supabase) {
    const err = new Error(FRIENDLY.not_configured);
    err.code = 'not_configured';
    throw err;
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    const err = new Error(FRIENDLY.offline);
    err.code = 'offline';
    throw err;
  }
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session) {
    const err = new Error(FRIENDLY.not_signed_in);
    err.code = 'not_signed_in';
    throw err;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const { data, error } = await supabase.functions.invoke(name, { body, signal: controller.signal });
    if (error) throw await friendlyError(error);
    if (!data || typeof data !== 'object') {
      const err = new Error(FRIENDLY.generic);
      err.code = 'generic';
      throw err;
    }
    return data;
  } catch (err) {
    if (err?.code) throw err;
    const aborted = controller.signal.aborted || err?.name === 'AbortError';
    const code = aborted ? 'timeout' : (typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'generic');
    const wrapped = new Error(FRIENDLY[code]);
    wrapped.code = code;
    throw wrapped;
  } finally {
    clearTimeout(timer);
  }
}

function cleanText(value, max) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) return '';
  return text.slice(0, max);
}

function badInput(message) {
  const err = new Error(message);
  err.code = 'bad_input';
  return err;
}

/**
 * @param {{ dish: string, cuisine?: 'chinese'|'korean'|'vietnamese' }} input
 * @returns {Promise<{
 *   dish: string, adapted_name: string, summary: string,
 *   ingredients: { name: string, amount_g: number, k_mg: number, p_mg: number, na_mg: number, swapped_from?: string }[],
 *   totals_before: { k_mg: number, p_mg: number, na_mg: number },
 *   totals_after:  { k_mg: number, p_mg: number, na_mg: number },
 *   levels_after:  { k: 'low'|'mid'|'high', p: 'low'|'mid'|'high', na: 'low'|'mid'|'high' },
 *   swaps: { from: string, to: string, why: string }[],
 *   tips: string[], source: 'ai'|'rules', disclaimer: string
 * }>}
 */
export async function adaptRecipe(input) {
  const dish = cleanText(input?.dish, 600);
  if (!dish) throw badInput('Please enter a dish.');
  const body = { dish };
  if (input?.cuisine) body.cuisine = input.cuisine;
  return invoke('recipe-adapter', body);
}

/**
 * @param {{ message: string, patient_name?: string }} input
 * @returns {Promise<{
 *   category: 'meal_question'|'scheduling'|'symptoms'|'labs'|'billing'|'other',
 *   urgency: 'routine'|'soon'|'urgent', red_flag: boolean, escalation: string|null,
 *   summary: string, draft_reply: string,
 *   suggested_slots: { iso: string, label: string }[],
 *   steps: { tool: string, detail: string }[], source: 'ai'|'rules'
 * }>}
 */
export async function triageInquiry(input) {
  const message = cleanText(input?.message, 600);
  if (!message) throw badInput('Please enter a question.');
  const body = { message };
  const name = cleanText(input?.patient_name, 60);
  if (name) body.patient_name = name;
  return invoke('inquiry-triage', body);
}
