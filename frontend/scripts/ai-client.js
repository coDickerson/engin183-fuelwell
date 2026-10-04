// Browser client for FuelWell's AI Edge Functions.
// STUB: the AI/backend agent replaces the bodies; signatures and return shapes are the contract.
import { supabase } from '../auth/supabase.js';

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
  throw new Error('The recipe helper is not connected yet.');
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
  throw new Error('The question helper is not connected yet.');
}
