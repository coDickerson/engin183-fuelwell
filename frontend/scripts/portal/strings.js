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
  // Notes page
  notes_title: s('Notes | FuelWell', '筆記 | FuelWell', 'Notas | FuelWell'),
  notes_h1: s('Notes', '筆記', 'Notas'),
  notes_sub: s('Weekly guides, meal plans and notes from Mom’s care team.', '醫療團隊為媽媽寫的每週指南、餐單和筆記。', 'Guías semanales, planes de comidas y notas del equipo de salud de mamá.'),
  notes_filters: s('Show notes', '顯示筆記', 'Mostrar notas'),
  filter_all: s('All', '全部', 'Todas'),
  filter_food: s('Meal plans & guides', '餐單與指南', 'Planes y guías'),
  filter_team: s('Doctor & dietitian notes', '醫生與營養師筆記', 'Notas del médico y la dietista'),
  week_of: s('Week of {date}', '{date} 那一週', 'Semana del {date}'),
  this_week: s('This week', '本週', 'Esta semana'),
  type_guide: s('Weekly guide', '每週指南', 'Guía semanal'),
  type_plan: s('Meal plan', '餐單', 'Plan de comidas'),
  type_dietitian: s('Dietitian note', '營養師筆記', 'Nota de la dietista'),
  type_doctor: s('Doctor note', '醫生筆記', 'Nota del médico'),
  type_ai: s('Saved from AI Chat', '從 AI 對話儲存', 'Guardado del chat con IA'),
  from_care_team: s('From Mom’s care team', '來自媽媽的醫療團隊', 'Del equipo de salud de mamá'),
  not_reviewed: s('Not reviewed by your dietitian', '未經營養師審核', 'No revisado por tu dietista'),
  ask_mei_review: s('Ask Mei to review it', '請 Mei 審核', 'Pedir a Mei que lo revise'),
  ai_note_summary: s('A meal plan FuelWell AI suggested. Ask Mei to check it before you use it.', 'FuelWell AI 建議的餐單。使用前請先讓 Mei 檢查。', 'Un plan de comidas sugerido por FuelWell AI. Pide a Mei que lo revise antes de usarlo.'),
  read_more: s('Read full note', '閱讀全文', 'Leer nota completa'),
  written_on: s('Written {date}', '{date} 撰寫', 'Escrita el {date}'),
  saved_on: s('Saved {date}', '{date} 儲存', 'Guardado el {date}'),
  notes_empty: s('No notes here yet.', '暫時未有筆記。', 'Todavía no hay notas aquí.'),
  // Today: zone bar
  zone_title: s('How Mom’s week looks', '媽媽這星期的情況', 'Cómo va la semana de mamá'),
  zone_ok: s('On track', '進度良好', 'Va bien'),
  zone_close: s('Getting close', '接近上限', 'Cerca del límite'),
  zone_talk: s('Talk to your dietitian', '請找營養師商量', 'Habla con tu dietista'),
  zone_aria: s('Mom’s zone this week: {zone}', '媽媽本週的範圍：{zone}', 'Zona de mamá esta semana: {zone}'),
  zone_ok_why: s('Mom’s meal plan this week fits her goals. Keep it up!', '媽媽本週的餐單符合目標，繼續保持！', 'El plan de comidas de mamá esta semana va con sus metas. ¡Sigan así!'),
  zone_close_why: s('{nutrient} is getting close to Mom’s limit.', '{nutrient}接近媽媽的上限。', 'El {nutrient} se acerca al límite de mamá.'),
  zone_talk_why: s('{nutrient} is over Mom’s limit this week. Please talk to Mei.', '{nutrient}本週超出媽媽的上限，請和 Mei 商量。', 'El {nutrient} pasa el límite de mamá esta semana. Por favor habla con Mei.'),
  zone_tip_k: s('Go easy on long-boiled soups, bananas and oranges.', '少飲老火湯，少吃香蕉和橙。', 'Con calma con las sopas largas, el plátano y la naranja.'),
  zone_tip_p: s('Go easy on dairy, dried seafood and packaged foods.', '少吃奶類、海味乾貨和包裝食品。', 'Con calma con los lácteos, mariscos secos y alimentos empacados.'),
  zone_tip_na: s('Measure soy and oyster sauce instead of pouring.', '豉油和蠔油要用匙量，不要直接倒。', 'Mide la soya y la salsa de ostión en vez de servirlas a ojo.'),
  zone_basis: s('Based on this week’s meal plan.', '根據本週餐單計算。', 'Según el plan de comidas de esta semana.'),
  zone_see_guide: s('See this week’s guide', '查看本週指南', 'Ver la guía de esta semana'),
  zone_message_mei: s('Message Mei', '傳訊息給 Mei', 'Escribir a Mei'),

  // Today: AI preview
  preview_title: s('Ask FuelWell AI', '問 FuelWell AI', 'Pregunta a FuelWell AI'),
  ai_short: s('AI', 'AI', 'IA'),
  preview_last: s('Last answer', '上一個回答', 'Última respuesta'),
  preview_empty: s('Ask how to make Mom’s favourite dishes kidney-friendly.', '問問怎樣讓媽媽愛吃的菜更適合腎臟。', 'Pregunta cómo adaptar los platos favoritos de mamá para sus riñones.'),
  preview_placeholder: s('Ask about a dish…', '問問某道菜…', 'Pregunta por un plato…'),
  preview_ask: s('Ask', '發問', 'Preguntar'),
  plan_check: s('Check this plan with Mei before big changes.', '作出較大改動前，請先和 Mei 確認這份餐單。', 'Revisa este plan con Mei antes de hacer cambios grandes.'),
};

export const pt = makeT(portalStrings);

/** Fill static markup tagged data-pt (text), data-pt-placeholder and data-pt-aria. */
export function fillPortalText(root = document) {
  root.querySelectorAll('[data-pt]').forEach((el) => { el.textContent = pt(el.dataset.pt); });
  root.querySelectorAll('[data-pt-placeholder]').forEach((el) => { el.placeholder = pt(el.dataset.ptPlaceholder); });
  root.querySelectorAll('[data-pt-aria]').forEach((el) => { el.setAttribute('aria-label', pt(el.dataset.ptAria)); });
}
