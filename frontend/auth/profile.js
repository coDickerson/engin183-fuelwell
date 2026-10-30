// Account profile: the name, cuisine preference and health conditions shown on the dashboard.
// Conditions are any of high blood pressure, diabetes and kidney disease, or none at all.
// Stored in public.profiles; RLS limits every read and write to the signed-in owner.
import { supabase } from './supabase.js';

// g5d = on dialysis. The stage is only kept when kidney disease is ticked.
export const CKD_STAGES = ['g1', 'g2', 'g3', 'g3a', 'g3b', 'g4', 'g5', 'g5d', 'unsure'];
export const MAX_NAME = 80;
export const MAX_CUISINE = 80;
const pendingKey = 'fuelwell.profile.v1';
const columns = 'full_name,cuisine,has_kidney_disease,ckd_stage,has_high_blood_pressure,has_diabetes';

/** Trim and bound the fields; returns null when there is no usable name. */
export function cleanProfile(input) {
  const fullName = String(input?.fullName || '').trim().replace(/\s+/g, ' ').slice(0, MAX_NAME);
  if (!fullName) return null;
  const cuisine = String(input.cuisine || '').trim().replace(/\s+/g, ' ').slice(0, MAX_CUISINE);
  const kidneyDisease = Boolean(input.kidneyDisease);
  return {
    fullName,
    cuisine: cuisine || null,
    kidneyDisease,
    stage: kidneyDisease && CKD_STAGES.includes(input.stage) ? input.stage : null,
    highBloodPressure: Boolean(input.highBloodPressure),
    diabetes: Boolean(input.diabetes),
  };
}

const fromRow = (row) => row && {
  fullName: row.full_name,
  cuisine: row.cuisine,
  kidneyDisease: row.has_kidney_disease,
  stage: row.ckd_stage,
  highBloodPressure: row.has_high_blood_pressure,
  diabetes: row.has_diabetes,
};

const toRow = (userId, p) => ({
  user_id: userId,
  full_name: p.fullName,
  cuisine: p.cuisine,
  has_kidney_disease: p.kidneyDisease,
  ckd_stage: p.stage,
  has_high_blood_pressure: p.highBloodPressure,
  has_diabetes: p.diabetes,
  updated_at: new Date().toISOString(),
});

export async function loadProfile(user) {
  if (!supabase) return null;
  const { data, error } = await supabase.from('profiles').select(columns).eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  return fromRow(data);
}

export async function saveProfile(user, profile) {
  const clean = cleanProfile(profile);
  if (!clean) throw new Error('Please enter your name.');
  const { data, error } = await supabase.from('profiles')
    .upsert(toRow(user.id, clean), { onConflict: 'user_id' })
    .select(columns)
    .single();
  if (error) throw error;
  return fromRow(data);
}

/* ---------- Answers from sign-up, held until the account exists ---------- */

export function stashPendingProfile(profile) {
  const clean = cleanProfile(profile);
  if (!clean) return;
  try { sessionStorage.setItem(pendingKey, JSON.stringify(clean)); } catch { /* storage unavailable */ }
}

export function clearPendingProfile() {
  try { sessionStorage.removeItem(pendingKey); } catch { /* storage unavailable */ }
}

/**
 * Save the sign-up answers for a new account. Never overwrites an existing profile,
 * so a stale draft can't replace what someone already saved.
 */
export async function savePendingProfile(user) {
  let pending = null;
  try { pending = cleanProfile(JSON.parse(sessionStorage.getItem(pendingKey) || 'null')); } catch { /* ignore */ }
  if (!pending) return;
  const { error } = await supabase.from('profiles')
    .upsert(toRow(user.id, pending), { onConflict: 'user_id', ignoreDuplicates: true });
  if (error) throw new Error('Your account is ready, but your profile could not be saved. You can add it from the dashboard.');
  clearPendingProfile();
}
