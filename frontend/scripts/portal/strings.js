// UI copy for the portal pieces Megan owns (AI Chat, Notes, Today zone bar and AI preview,
// Appointments "real dietitian" banner) in English, Traditional Chinese and Spanish.
// Kept apart from app-strings.js so the two sets of pages don't collide in git.
import { makeT } from '../i18n.js';

const s = (en, zh, es) => ({ en, zh, es });

export const portalStrings = {
  // Shared AI note
  ai_note: s('FuelWell AI gives ideas, not medical advice. It doesn’t replace Mei, your dietitian.', 'FuelWell AI 只提供建議，並非醫療意見，也不能取代你的營養師 Mei。', 'FuelWell AI da ideas, no consejos médicos. No reemplaza a Mei, tu dietista.'),
  ai_note_link: s('Book a visit with Mei', '預約 Mei 覆診', 'Reservar cita con Mei'),
  ai_name: s('FuelWell AI', 'FuelWell AI', 'FuelWell AI'),
  ai_tag: s('AI · not your dietitian', 'AI · 並非營養師', 'IA · no es tu dietista'),

  // AI Chat page
  chat_title: s('AI Chat | FuelWell', 'AI 對話 | FuelWell', 'Chat con IA | FuelWell'),
  chat_h1: s('AI Chat', 'AI 對話', 'Chat con IA'),
  chat_sub: s('Ask how to keep Mom’s favourite dishes kidney-friendly.', '問問怎樣讓媽媽愛吃的菜更適合腎臟。', 'Pregunta cómo adaptar los platos favoritos de mamá para cuidar sus riñones.'),
  chat_greeting: s('Hi {name}! I’m FuelWell AI. Ask me about one of Mom’s dishes, a sauce, or a meal plan.', '{name} 你好！我是 FuelWell AI。可以問我媽媽愛吃的菜、醬料，或請我編排餐單。', '¡Hola, {name}! Soy FuelWell AI. Pregúntame por un plato de mamá, una salsa o un plan de comidas.'),
  chat_you: s('You', '你', 'Tú'),
  chat_try: s('Try:', '試試：', 'Prueba:'),
  chat_label: s('Your question for FuelWell AI', '你想問 FuelWell AI 的問題', 'Tu pregunta para FuelWell AI'),
  chat_placeholder: s('Type a question about Mom’s food…', '輸入關於媽媽飲食的問題…', 'Escribe una pregunta sobre la comida de mamá…'),
  chat_send: s('Send', '傳送', 'Enviar'),
  chat_thinking: s('FuelWell AI is thinking…', 'FuelWell AI 正在思考…', 'FuelWell AI está pensando…'),
  chat_write_first: s('Type a question first.', '請先輸入問題。', 'Escribe una pregunta primero.'),
  chat_error: s('FuelWell AI couldn’t answer just now. Please try again.', 'FuelWell AI 暫時未能回答，請再試一次。', 'FuelWell AI no pudo responder ahora. Inténtalo de nuevo.'),
  chat_demo: s('Practice replies for now. Chats stay in this browser session.', '目前為示範回覆，對話只保留於此瀏覽器工作階段。', 'Por ahora son respuestas de práctica. El chat se guarda solo en esta sesión.'),
  chat_urgent: s('Call a person', '請聯絡醫護人員', 'Llama a una persona'),
  plan_save: s('Save to my notes', '儲存到我的筆記', 'Guardar en mis notas'),
  plan_saved: s('Saved to Notes', '已儲存到筆記', 'Guardado en Notas'),
  plan_view: s('View in Notes', '在筆記中查看', 'Ver en Notas'),
  plan_saved_toast: s('Meal plan saved to your notes.', '餐單已儲存到你的筆記。', 'Plan de comidas guardado en tus notas.'),
  plan_check: s('Check this plan with Mei before big changes.', '作出較大改動前，請先和 Mei 確認這份餐單。', 'Revisa este plan con Mei antes de hacer cambios grandes.'),
};

export const pt = makeT(portalStrings);

/** Fill static markup tagged data-pt (text), data-pt-placeholder and data-pt-aria. */
export function fillPortalText(root = document) {
  root.querySelectorAll('[data-pt]').forEach((el) => { el.textContent = pt(el.dataset.pt); });
  root.querySelectorAll('[data-pt-placeholder]').forEach((el) => { el.placeholder = pt(el.dataset.ptPlaceholder); });
  root.querySelectorAll('[data-pt-aria]').forEach((el) => { el.setAttribute('aria-label', pt(el.dataset.ptAria)); });
}
