// AI chat history, notes saved from the chat, and the Today → AI Chat hand-off.
// Like bookings, these live in this browser session only.
import { storage } from '../app-ui.js';

const store = storage('session');
const CHAT_KEY = 'fuelwell.portal.chat.v1';
const NOTES_KEY = 'fuelwell.portal.saved-notes.v1';
const ASK_KEY = 'fuelwell.portal.ask.v1';

export const chatHistory = () => store.get(CHAT_KEY, []);

/** Add { from: 'me'|'ai', text, mealPlan?, urgent? } to the chat and return it with an id and time. */
export function addChatMessage(message) {
  const saved = { id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, at: new Date().toISOString(), ...message };
  store.set(CHAT_KEY, [...chatHistory(), saved]);
  return saved;
}

export const lastAiMessage = () => chatHistory().filter((m) => m.from === 'ai').pop() || null;

export const savedNotes = () => store.get(NOTES_KEY, []);
export const isSaved = (sourceId) => savedNotes().some((n) => n.sourceId === sourceId);

/** Save an AI meal plan to Notes once. */
export function saveMealPlan(message) {
  if (!message?.mealPlan || isSaved(message.id)) return;
  store.set(NOTES_KEY, [...savedNotes(), { id: `n-${message.id}`, sourceId: message.id, savedAt: new Date().toISOString(), plan: message.mealPlan }]);
}

// The Today preview passes a question to AI Chat without putting it in the address bar.
export const handOffQuestion = (text) => store.set(ASK_KEY, text);
export function takeHandOff() {
  const text = store.get(ASK_KEY, null);
  store.set(ASK_KEY, null);
  return text;
}
