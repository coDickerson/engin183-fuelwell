// The one place the portal pages talk to the FuelWell AI agent.
//
// When VITE_CHAT_AGENT_ENABLED=true, the portal calls the authenticated LangChain
// Edge Function. The default remains the teammates' fictional mock until deployment.
import { agentReplies, defaultReply, urgentReply, urgentWords } from '../../data/portal.js';
import { supabase } from '../../auth/supabase.js';

const MOCK_DELAY_MS = 900;

/**
 * @param {{ message: string, history?: { from: 'me'|'ai', text: string }[], language?: 'en'|'zh'|'es' }} input
 * @returns {Promise<{
 *   text: string | { en: string, zh: string, es: string },
 *   mealPlan?: { title: string|object, days: { label: string|object, meals: { slot: string|object, name: string|object, tip?: string|object }[] }[] },
 *   urgent?: boolean,
 *   source: 'mock'|'ai'
 * }>}
 * Text may be a plain string (the real agent, already in `language`) or an { en, zh, es } object.
 */
export async function askAgent({ message, history = [], language = 'en', patientId = null }) {
  const question = String(message || '').trim();
  if (!question) throw new Error('empty');
  if (import.meta.env.VITE_CHAT_AGENT_ENABLED === 'true') {
    if (!supabase) throw new Error('Account access is not configured.');
    const { data, error } = await supabase.functions.invoke('chat-agent', {
      body: { message: question, language, history: history.slice(-4).map((item) => ({ from: item.from, text: String(item.text || '').slice(0, 350) })), ...(patientId ? { patientId } : {}) },
    });
    if (error) throw error;
    if (!data || typeof data.text !== 'string') throw new Error('The agent returned an invalid response.');
    return { text: data.text, urgent: data.urgent === true, source: data.source || 'ai', citations: data.citations || [] };
  }
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
  if (urgentWords.test(question)) return { text: urgentReply, urgent: true, source: 'mock' };
  const rule = agentReplies.find((r) => r.match.test(question));
  if (!rule) return { text: defaultReply, source: 'mock' };
  return { text: rule.text, ...(rule.mealPlan ? { mealPlan: rule.mealPlan } : {}), source: 'mock' };
}
