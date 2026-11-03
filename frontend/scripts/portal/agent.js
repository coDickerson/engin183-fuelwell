// The one place the portal pages talk to the FuelWell AI agent.
//
// The real agent is still being built, so askAgent() answers from mock replies in
// data/portal.js. To plug the real agent in, replace the body of askAgent() (for example
// with supabase.functions.invoke('chat-agent', …) the way scripts/ai-client.js does) and
// keep the return shape below. AI Chat, the Today preview and Notes then work unchanged.
import { agentReplies, defaultReply, urgentReply, urgentWords } from '../../data/portal.js';

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
export async function askAgent({ message }) {
  const question = String(message || '').trim();
  if (!question) throw new Error('empty');
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
  if (urgentWords.test(question)) return { text: urgentReply, urgent: true, source: 'mock' };
  const rule = agentReplies.find((r) => r.match.test(question));
  if (!rule) return { text: defaultReply, source: 'mock' };
  return { text: rule.text, ...(rule.mealPlan ? { mealPlan: rule.mealPlan } : {}), source: 'mock' };
}
