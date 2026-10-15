import { authConfigError, supabase } from '../auth/supabase.js';

// Class survey at /waitlist (the QR code in the launch video):
//   1. a family dish for the live food board (/wall)
//   2. do you know family or friends with kidney disease? yes -> send them the waitlist (/join)
//   3. a 3-minute beta test of the demo, then feedback; finishing it enters the gift card draw
// Each step saves its own row, so earlier answers still count if someone stops early.

const STATE_KEY = 'fuelwell.survey.v2';
const byId = (id) => document.getElementById(id);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const STEPS = { dish: '1 of 3', know: '2 of 3', beta: '3 of 3', feedback: '3 of 3', done: 'Done' };

function newId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16));
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STATE_KEY));
    if (saved?.id) return saved;
  } catch { /* private mode or bad JSON: start fresh */ }
  return { id: newId(), step: 'dish', dish: null, answer: null, triedDemo: false, feedbackSent: false, name: '', repeat: false };
}
const state = load();
function save() {
  try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch { /* fine without it */ }
}

const offline = (error) => /failed to fetch|network|load failed/i.test(error?.message || '');

function formError(id, text, field) {
  const box = byId(id);
  box.textContent = text || '';
  box.hidden = !text;
  box.closest('form').querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
  if (field) { field.setAttribute('aria-invalid', 'true'); field.focus(); }
}

function busy(button, on, label) {
  button.disabled = on;
  if (on) { button.dataset.label = button.textContent; button.textContent = label; button.setAttribute('aria-busy', 'true'); }
  else { button.textContent = button.dataset.label; button.removeAttribute('aria-busy'); }
}

/* ---------- Steps ---------- */

function goTo(step, { focus = true } = {}) {
  state.step = step;
  save();
  document.querySelectorAll('.sv-step').forEach((el) => { el.hidden = el.dataset.step !== step; });
  byId('step-label').textContent = STEPS[step];
  byId('intro').hidden = step !== 'dish';
  if (step === 'done') renderDone();
  if (focus) {
    const card = byId('survey');
    if (card.getBoundingClientRect().top < 0) card.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    document.querySelector(`[data-step="${step}"] .sv-q`)?.focus({ preventScroll: true });
  }
}
document.querySelectorAll('[data-go]').forEach((button) => button.addEventListener('click', () => goTo(button.dataset.go)));

/* ---------- Step 1: family food board ---------- */

// Mirrors the database check so pranks get a friendly message instead of an error.
const BLOCKED = /(fuck|shit|bitch|cunt|nigg|faggot|\bfag\b|\bdick|\bcock\b|pussy|porn|\bsexy?\b|nazi|hitler|\brape|slut|whore|retard|penis|vagina|\bkys\b|kill yourself|\banal\b|\bcum\b|\btits?\b)/i;
const PRANK = 'Nice try 😄 Let’s keep the board about food.';

byId('dish-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const dish = byId('dish').value.trim();
  const origin = byId('origin').value.trim() || null;
  if (!dish) return formError('dish-error', 'Add a dish your family makes.', byId('dish'));
  if (BLOCKED.test(`${dish} ${origin || ''}`)) return formError('dish-error', PRANK, byId('dish'));
  if (authConfigError) return formError('dish-error', 'The board isn’t connected right now. Please try again later.');
  formError('dish-error', '');

  const button = event.target.querySelector('.sv-submit');
  busy(button, true, 'Adding…');
  try {
    const { error } = await supabase.from('dish_wall').insert({ response_id: state.id, dish, origin });
    if (error) throw error;
    state.dish = dish;
    window.va?.('event', { name: 'survey_dish' });
    goTo('know');
  } catch (error) {
    formError('dish-error', error?.code === '23514' ? PRANK
      : offline(error) ? 'We couldn’t reach the board. Check your connection and try again.' : 'Something went wrong. Please try again.');
  } finally {
    busy(button, false);
  }
});

/* ---------- Step 2: know someone? ---------- */

function showAnswer(answer) {
  document.querySelectorAll('[data-answer]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.answer === answer)));
  byId('send-panel').hidden = answer !== 'yes';
}

document.querySelectorAll('[data-answer]').forEach((button) => button.addEventListener('click', async () => {
  const answer = button.dataset.answer;
  const first = !state.answer;
  state.answer = answer;
  save();
  showAnswer(answer);
  if (answer === 'yes') {
    const title = byId('send-title');
    title.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    title.focus({ preventScroll: true });
  } else {
    goTo('beta');
  }
  if (!first || !supabase) return;
  // The first answer per browser is the one that counts; a repeat (23505) is ignored.
  const { error } = await supabase.from('class_survey_answers').insert({ response_id: state.id, knows_someone: answer === 'yes' });
  if (error && error.code !== '23505') console.warn('Survey answer not saved', error);
  window.va?.('event', { name: 'survey_answer', data: { answer } });
}));

/* ---------- Sharing ---------- */

const FAMILY_TEXT = {
  en: 'Hi! I learned about FuelWell in class. It plans kidney-friendly meals from the food our family already cooks, with a renal dietitian to help. Joining the waitlist takes 30 seconds:',
  'zh-Hans': '你好！我在课上了解到 FuelWell。它会根据我们家平时做的菜，安排对肾脏友好的饮食，还有肾脏营养师帮忙。加入候补名单只要 30 秒：',
  'zh-Hant': '你好！我在課堂上了解到 FuelWell。它會根據我們家平時做的菜，安排對腎臟友善的飲食，還有腎臟營養師幫忙。加入候補名單只要 30 秒：',
  es: '¡Hola! Conocí FuelWell en clase. Planea comidas buenas para los riñones con la comida que nuestra familia ya cocina, con ayuda de un dietista renal. Unirse a la lista de espera toma 30 segundos:',
};
const FRIENDS_TEXT = 'I just added my family’s dish to the FuelWell food board. Add yours, then beta test for 3 minutes for a chance at a gift card:';

function shareContent(kind, locale) {
  if (kind === 'family') {
    const url = new URL('/join', location.origin);
    url.searchParams.set('ref', 'friend');
    url.searchParams.set('lang', locale);
    return { text: FAMILY_TEXT[locale], url: url.href };
  }
  return { text: FRIENDS_TEXT, url: new URL('/waitlist', location.origin).href };
}

function setupShareBox(box) {
  box.replaceChildren(byId('share-template').content.cloneNode(true));
  const kind = box.dataset.share;
  const langs = box.querySelector('.sv-langs');
  const message = box.querySelector('.sv-message');
  const status = box.querySelector('.sv-share-status');
  let locale = 'en';
  if (kind === 'friends') langs.hidden = true;

  const full = () => { const { text, url } = shareContent(kind, locale); return { text, url, all: `${text} ${url}` }; };
  const render = () => {
    const { all } = full();
    message.textContent = all;
    message.lang = locale;
    langs.querySelectorAll('.sv-lang').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.locale === locale)));
    box.querySelector('.sv-share-sms').href = `sms:?&body=${encodeURIComponent(all)}`;
    box.querySelector('.sv-share-wa').href = `https://wa.me/?text=${encodeURIComponent(all)}`;
  };
  const track = (how) => window.va?.('event', { name: 'survey_share', data: { kind, how, locale } });
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(full().all);
      status.textContent = 'Copied! Paste it into any chat.';
      track('copy');
    } catch {
      status.textContent = 'Select the message above and copy it.';
    }
  };

  langs.querySelectorAll('.sv-lang').forEach((b) => b.addEventListener('click', () => { locale = b.dataset.locale; status.textContent = ''; render(); }));
  box.querySelector('.sv-share-native').addEventListener('click', async () => {
    if (!navigator.share) return copy();
    const { text, url } = full();
    try {
      await navigator.share({ title: 'FuelWell', text, url });
      track('native');
    } catch (error) {
      if (error?.name !== 'AbortError') copy();
    }
  });
  box.querySelector('.sv-share-copy').addEventListener('click', copy);
  box.querySelector('.sv-share-sms').addEventListener('click', () => track('sms'));
  box.querySelector('.sv-share-wa').addEventListener('click', () => track('whatsapp'));
  render();
}
document.querySelectorAll('.sv-share-box').forEach(setupShareBox);

/* ---------- Step 3: beta test ---------- */

// The demo opens in a new tab; this tab moves on to the questions so they're waiting on return.
function demoOpened() {
  state.triedDemo = true;
  save();
  window.va?.('event', { name: 'survey_demo_opened' });
}
byId('open-demo').addEventListener('click', () => {
  demoOpened();
  setTimeout(() => goTo('feedback', { focus: false }), 300);
});
byId('reopen-demo').addEventListener('click', demoOpened);

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
byId('feedback-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target;
  const data = new FormData(form);
  const text = (name) => (data.get(name) || '').toString().trim();
  const row = {
    response_id: state.id,
    first_name: text('first_name'),
    email: text('email').toLowerCase(),
    tried_demo: state.triedDemo,
    clarity: Number(text('clarity')) || null,
    confusing: text('confusing') || null,
    would_recommend: text('would_recommend') || null,
    other: text('other') || null,
  };
  if (!row.clarity) return formError('feedback-error', 'Pick a number for how clear FuelWell was.', form.querySelector('input[name="clarity"]'));
  if (!row.would_recommend) return formError('feedback-error', 'Let us know if you’d recommend FuelWell.', form.querySelector('input[name="would_recommend"]'));
  if (!row.first_name) return formError('feedback-error', 'Add your first name so we know who won.', byId('first-name'));
  if (!EMAIL.test(row.email)) return formError('feedback-error', 'Check your email. It doesn’t look quite right.', byId('email'));
  formError('feedback-error', '');

  const finish = (repeat = false) => {
    Object.assign(state, { feedbackSent: true, name: row.first_name, repeat });
    goTo('done');
  };
  // Bots that fill the hidden field get the thank-you screen without a saved row.
  if (byId('company').value) return finish();
  if (authConfigError) return formError('feedback-error', 'Feedback isn’t connected right now. Please try again later.');

  const button = form.querySelector('.sv-submit');
  busy(button, true, 'Sending…');
  try {
    const { error } = await supabase.from('beta_feedback').insert(row);
    // 23505 = this email already sent feedback; one draw entry per person, so that's fine.
    if (error && error.code !== '23505') throw error;
    window.va?.('event', { name: 'survey_feedback', data: { clarity: row.clarity, would_recommend: row.would_recommend } });
    finish(error?.code === '23505');
  } catch (error) {
    formError('feedback-error', offline(error) ? 'We couldn’t reach the server. Check your connection and try again.' : 'Something went wrong. Please try again.');
  } finally {
    busy(button, false);
  }
});

/* ---------- Thank you ---------- */

async function renderDone() {
  const title = byId('done-title');
  const body = byId('done-body');
  byId('done-beta').hidden = state.feedbackSent;
  if (state.feedbackSent && state.repeat) {
    title.textContent = 'Thanks! You’re already in the draw.';
    body.textContent = 'That email already has an entry (one per person). Thanks for testing FuelWell again!';
  } else if (state.feedbackSent) {
    title.textContent = `Thanks, ${state.name}!`;
    body.textContent = 'Your feedback is in and so is your gift card draw entry. We’ll email you if you win.';
  } else {
    title.textContent = 'Thank you!';
    body.textContent = state.dish ? 'Your dish is on the family food board.' : 'Thanks for stopping by.';
  }

  if (!supabase) return;
  const { data, error } = await supabase.from('dish_wall').select('id, dish, origin').order('created_at', { ascending: false }).limit(8);
  if (error || !data?.length) return;
  byId('mini-list').replaceChildren(...data.map((row) => {
    const li = document.createElement('li');
    const dish = document.createElement('strong');
    dish.textContent = row.dish;
    li.append(dish);
    if (row.origin) {
      const origin = document.createElement('span');
      origin.textContent = row.origin;
      li.append(origin);
    }
    if (state.dish && row.dish === state.dish) li.classList.add('is-mine');
    return li;
  }));
  byId('mini-wall').hidden = false;
}

/* ---------- Start ---------- */

if (state.answer) showAnswer(state.answer);
goTo(STEPS[state.step] ? state.step : 'dish', { focus: false });
