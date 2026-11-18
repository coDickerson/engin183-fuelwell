// AI Chat: a full conversation with FuelWell AI, kept clearly apart from Mei (the real dietitian).
// Every answer comes from askAgent() in agent.js, so the real agent can be plugged in there later.
import { initShell } from '../app-shell.js';
import { esc, fmt, icon, toast } from '../app-ui.js';
import { lang, tr } from '../i18n.js';
import { chatSuggestions } from '../../data/portal.js';
import { askAgent } from './agent.js';
import { addChatMessage, chatHistory, isSaved, saveMealPlan, takeHandOff } from './chat-store.js';
import { aiNote } from './ai-note.js';
import { fillPortalText, pt } from './strings.js';

const $ = (sel) => document.querySelector(sel);
let ctx;
let thinking = false;

// AI text keeps its line breaks; everything is escaped first.
const aiText = (value) => esc(tr(value)).replace(/\n/g, '<br>');

function planCard(m) {
  const plan = m.mealPlan;
  return `<div class="plan-card" data-plan="${esc(m.id)}">
    <h3>${esc(tr(plan.title))}</h3>
    <ol class="plan-days">${plan.days.map((d) => `<li><h4>${esc(tr(d.label))}</h4>
      <ul>${d.meals.map((meal) => `<li><span class="plan-slot">${esc(tr(meal.slot))}</span> ${esc(tr(meal.name))}</li>`).join('')}</ul></li>`).join('')}</ol>
    <p class="hint">${esc(pt('plan_check'))}</p>
    ${isSaved(m.id)
      ? `<p class="plan-saved">${icon('check')}<span>${esc(pt('plan_saved'))}</span> <a href="/notes.html">${esc(pt('plan_view'))}</a></p>`
      : `<button class="button button--secondary" type="button" data-save="${esc(m.id)}">${icon('plus')}<span>${esc(pt('plan_save'))}</span></button>`}
  </div>`;
}

function bubble(m) {
  const mine = m.from === 'me';
  return `<li class="bubble-row${mine ? ' bubble-row--mine' : ''}">
    ${mine ? '' : `<span class="avatar ai-avatar" aria-hidden="true">${icon('sparkle')}</span>`}
    <div class="bubble${m.urgent ? ' bubble--urgent' : ''}">
      <p class="bubble-meta"><strong>${esc(mine ? pt('chat_you') : pt('ai_name'))}</strong>${m.at ? ` <span class="muted">${esc(fmt.time(new Date(m.at)))}</span>` : ''}</p>
      ${m.urgent ? `<p class="urgent-label">${icon('alert')}<span>${esc(pt('chat_urgent'))}</span></p>` : ''}
      <p class="bubble-text">${mine ? esc(m.text) : aiText(m.text)}</p>
      ${m.mealPlan ? planCard(m) : ''}
    </div>
  </li>`;
}

const thread = () => $('[data-chat]');
const scrollDown = () => { thread().scrollTop = thread().scrollHeight; };

function renderThread() {
  const greeting = { from: 'ai', text: pt('chat_greeting', { name: ctx.displayName }) };
  thread().innerHTML = [greeting, ...chatHistory()].map(bubble).join('');
  scrollDown();
}

// New messages are appended so screen readers announce only the new one.
// The thread scrolls to the start of the new message so long answers read from the top.
function append(html) {
  const list = thread();
  list.insertAdjacentHTML('beforeend', html);
  const added = list.lastElementChild;
  list.scrollTop += added.getBoundingClientRect().top - list.getBoundingClientRect().top - 16;
}

function setBusy(busy) {
  thinking = busy;
  $('[data-chat-send]').disabled = busy;
  $('[data-chat-form]').setAttribute('aria-busy', String(busy));
}

async function send(question) {
  const box = $('#chat-text');
  const q = String(question || '').trim();
  if (thinking) return;
  if (!q) { toast(pt('chat_write_first')); box.focus(); return; }
  const history = chatHistory().map((m) => ({ from: m.from, text: tr(m.text) }));
  box.value = '';
  setBusy(true);
  append(bubble(addChatMessage({ from: 'me', text: q })));
  append(`<li class="bubble-row chat-thinking" data-thinking><span class="avatar ai-avatar" aria-hidden="true">${icon('sparkle')}</span><div class="bubble"><p class="bubble-status"><span class="spinner" aria-hidden="true"></span>${esc(pt('chat_thinking'))}</p></div></li>`);
  try {
    const reply = await askAgent({ message: q, history, language: lang() });
    $('[data-thinking]')?.remove();
    append(bubble(addChatMessage({
      from: 'ai',
      text: reply.text,
      ...(reply.mealPlan ? { mealPlan: reply.mealPlan } : {}),
      ...(reply.urgent ? { urgent: true } : {}),
    })));
  } catch {
    $('[data-thinking]')?.remove();
    append(`<li class="bubble-row"><span class="avatar ai-avatar" aria-hidden="true">${icon('sparkle')}</span><div class="bubble"><p class="bubble-text">${esc(pt('chat_error'))}</p></div></li>`);
  } finally {
    setBusy(false);
  }
}

function renderSuggestions() {
  $('[data-chat-suggestions]').innerHTML = chatSuggestions.map((q, i) => `<button class="chip-button" type="button" data-suggest="${i}">${esc(tr(q))}</button>`).join('');
}

function wire() {
  const form = $('[data-chat-form]');
  const box = $('#chat-text');
  form.addEventListener('submit', (e) => { e.preventDefault(); send(box.value); });
  // Enter sends; Shift+Enter starts a new line.
  box.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); }
  });
  form.addEventListener('click', (e) => {
    const b = e.target.closest('[data-suggest]');
    if (b) send(tr(chatSuggestions[Number(b.dataset.suggest)]));
  });
  thread().addEventListener('click', (e) => {
    const b = e.target.closest('[data-save]');
    if (!b) return;
    const message = chatHistory().find((m) => m.id === b.dataset.save);
    saveMealPlan(message);
    const card = b.closest('[data-plan]');
    card.outerHTML = planCard(message);
    thread().querySelector(`[data-plan="${CSS.escape(message.id)}"] a`)?.focus();
    toast(pt('plan_saved_toast'));
  });
}

let wired = false;
initShell({
  page: 'chat',
  render(shellCtx) {
    ctx = shellCtx;
    document.title = pt('chat_title');
    fillPortalText();
    $('[data-ai-note]').innerHTML = aiNote();
    renderSuggestions();
    renderThread();
    if (!wired) {
      wired = true;
      wire();
      // A question typed on Today arrives here and is sent straight away.
      const handed = takeHandOff();
      if (handed) send(handed);
    }
  },
});
