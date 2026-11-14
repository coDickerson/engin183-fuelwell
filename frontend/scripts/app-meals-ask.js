// Meals > "Swap & eat out": Swap a meal (text or photo), Eating out and Family recipe,
// answered by the LangChain routes (/api/swap, /api/eatout, /api/recipe).
// "Browse swaps" (its own sub-tab) lives in app-meals-browse.js and calls personalize().
// Uses the app's own components (card, filter, chip, notice, data-table); no new look.
import { esc, icon, toast } from './app-ui.js';
import { persona } from '../data/fung.js';
import { tr } from './i18n.js';
import { t } from './app-strings.js';
import { track } from './track.js';
import { inlineJoinHtml, offerJoin } from './signup-nudge.js';

const $ = (sel, root = document) => root.querySelector(sel);

const MODES = {
  swap: { endpoint: '/api/swap', submit: 'sw_submit_swap', error: 'sw_err_swap', examples: ['Congee with salted egg', 'Pho', 'Big Mac and fries', 'Frozen lasagna', 'Ice cream at night'] },
  eatout: { endpoint: '/api/eatout', submit: 'sw_submit_eatout', error: 'sw_err_eatout', examples: ['Panda Express', 'El Pollo Loco', 'Dim sum', "McDonald's", 'A pho restaurant'] },
  recipe: { endpoint: '/api/recipe', submit: 'sw_submit_recipe', error: 'sw_err_recipe', examples: ["Grandma's braised pork belly", 'Steamed fish with soy sauce', 'Lo mein with char siu'] },
};
const NUTRIENT_KEY = { Na: 'sodium', K: 'potassium', P: 'phosphorus' };

// The app's patient (Fung, CKD G3b, Cantonese home cooking) is the profile the AI tailors to.
const PROFILE = { for_whom: 'family', stage: 'stage3', cuisines: ['Chinese'], usually: 'home', notes: 'Cantonese home cooking; age 78' };

const state = { mode: 'swap', photo: null, busy: false, view: { state: 'empty' }, last: null };

const nutrient = (n) => (NUTRIENT_KEY[n] ? `${n} · ${t(NUTRIENT_KEY[n])}` : n);

/* ---------- Form ---------- */
function paintForm() {
  document.querySelectorAll('[data-ask-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.askMode === state.mode)));
  document.querySelectorAll('[data-ask-fields]').forEach((f) => { f.hidden = f.dataset.askFields !== state.mode; });
  $('[data-ask-submit-label]').textContent = t(MODES[state.mode].submit);
  $('[data-ask-examples]').innerHTML = MODES[state.mode].examples.map((ex) => `<button class="chip-button" type="button" data-ask-example="${esc(ex)}">${esc(ex)}</button>`).join('');
  $('[data-ask-for]').textContent = `${t('sw_for', { who: tr(persona.patient.relation) })} ${t('sw_english_note')}`;
}

function mainField() {
  return state.mode === 'swap' ? $('#ask-meal') : state.mode === 'eatout' ? $('#ask-restaurant') : $('#ask-recipe');
}

function showError(msg) {
  const el = $('[data-ask-error]');
  el.textContent = msg || '';
  el.hidden = !msg;
  if (msg) mainField().setAttribute('aria-invalid', 'true'); else mainField().removeAttribute('aria-invalid');
}

function buildBody() {
  if (state.mode === 'swap') {
    const meal = $('#ask-meal').value.trim();
    if (!meal && !state.photo) return null;
    return { meal: meal || undefined, imageBase64: state.photo || undefined, profile: PROFILE };
  }
  if (state.mode === 'eatout') {
    const restaurant = $('#ask-restaurant').value.trim();
    if (!restaurant) return null;
    return { restaurant, usualOrder: $('#ask-usual').value.trim() || undefined, profile: PROFILE };
  }
  const recipe = $('#ask-recipe').value.trim();
  return recipe ? { recipe, profile: PROFILE } : null;
}

/* ---------- Photo: shrink in the browser before sending ---------- */
async function shrinkImage(file, maxSide = 1280) {
  let bmp;
  try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch {
    const url = URL.createObjectURL(file);
    try { bmp = new Image(); bmp.src = url; await bmp.decode(); } finally { URL.revokeObjectURL(url); }
  }
  const w = bmp.width || bmp.naturalWidth;
  const h = bmp.height || bmp.naturalHeight;
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.82);
}

function setPhoto(dataUrl) {
  state.photo = dataUrl;
  $('[data-ask-photo-chip]').hidden = !dataUrl;
  $('[data-ask-photo-thumb]').src = dataUrl || '';
}

/* ---------- Result ---------- */
const result = () => $('[data-ask-result]');

// On phones and narrow screens the answer sits below the form, so bring it into view.
const stacked = () => matchMedia('(max-width: 1099px)').matches;
const motion = () => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');
/** Scrolls so `el` starts just below the sticky top bar. */
function reveal(el) {
  const bar = $('.app-top')?.getBoundingClientRect().height || 0;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - bar - 12, behavior: motion() });
}

function paintResult() {
  const v = state.view;
  result().dataset.state = v.state;
  if (v.state === 'loading') return loadingState(v.what);
  if (v.state === 'error') return errorState(v.message);
  if (v.state === 'result') return renderResult(v.data, false);
  result().setAttribute('aria-busy', 'false');
  result().innerHTML = `<div class="empty">
    <span class="empty-icon">${icon('sparkle')}</span>
    <h3>${esc(t('sw_empty_title'))}</h3>
    <p class="muted">${esc(t('sw_empty_body'))}</p>
  </div>`;
}

function loadingState(what) {
  result().setAttribute('aria-busy', 'true');
  result().innerHTML = `<div class="loading-block">
    <p class="loading-title"><span class="spinner" aria-hidden="true"></span>${esc(t('sw_loading', { what }))}</p>
    <p class="muted">${esc(t('sw_loading_sub'))}</p>
    <div class="sk sk-line"></div><div class="sk sk-line sk-line--short"></div><div class="sk sk-block"></div><div class="sk sk-line"></div>
  </div>`;
}

function errorState(message) {
  result().setAttribute('aria-busy', 'false');
  result().innerHTML = `<div class="state-error" role="alert">
    <span class="empty-icon empty-icon--error">${icon('alert')}</span>
    <h3>${esc(t('sw_error_title'))}</h3>
    <p>${esc(message)}</p>
    ${state.last ? `<button class="button" type="button" data-ask-retry>${icon('retry')}${esc(t('try_again'))}</button>` : ''}
  </div>`;
  $('[data-ask-retry]', result())?.addEventListener('click', () => request(state.last.mode, state.last.body, state.last.what));
}

function sourcesBlock(data) {
  const list = data.sources || [];
  const items = list.map((s) => (s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a>` : esc(s.title)));
  return `<p class="muted ask-sources"><strong>${esc(t('sw_sources'))}:</strong> ${items.length ? items.join(' · ') : esc(t('sw_sources_none'))}</p>`;
}

const tipList = (arr) => `<ul class="tip-list">${arr.map((x) => `<li>${icon('check')}<span>${x}</span></li>`).join('')}</ul>`;

function swapBody(data) {
  const c = data.card;
  const watch = (c.watch || []).map((w) => `<li><span class="chip chip--plain">${esc(nutrient(w.nutrient))}</span><span>${esc(w.note)}</span></li>`).join('');
  const swaps = (c.swaps || []).map((s) => `<li>${icon('check')}<span><strong>${esc(s.title)}</strong><br>${esc(s.how)}<br><span class="muted">${esc(s.why)}</span></span></li>`).join('');
  return {
    title: c.dish,
    tag: `<span class="chip">${esc(t(`sw_verdict_${c.verdict}`))}</span>`,
    lead: `${data.photo_dish ? `<p class="muted">${esc(t('sw_from_photo', { dish: data.photo_dish }))}</p>` : ''}${c.answer ? `<p class="result-summary">${esc(c.answer)}</p>` : ''}<p class="${c.answer ? 'muted' : 'result-summary'}">${esc(c.headline)}</p>`,
    body: `
      ${watch ? `<h4 class="result-sub">${esc(t('sw_watch'))}</h4><ul class="ask-watch">${watch}</ul>` : ''}
      ${swaps ? `<h4 class="result-sub">${esc(t('sw_swaps'))}</h4><ul class="tip-list">${swaps}</ul>` : ''}
      <p class="notice ask-tonight">${icon('leaf')}<span><strong>${esc(t('sw_tonight'))}:</strong> ${esc(c.tonight)}</span></p>`,
  };
}

function eatoutBody(data) {
  const c = data.card;
  const picks = (c.picks || []).map((p) => `<li>${icon('check')}<span><strong>${esc(p.item)}</strong><br><em>${esc(t('sw_say', { x: p.say }))}</em><br><span class="muted">${esc(p.why)}</span></span></li>`).join('');
  return {
    title: c.restaurant,
    tag: '',
    lead: '',
    body: `
      <h4 class="result-sub">${esc(t('sw_picks'))}</h4><ul class="tip-list">${picks}</ul>
      ${c.skip ? `<h4 class="result-sub">${esc(t('sw_skip'))}</h4><p><strong>${esc(c.skip.item)}</strong><br><span class="muted">${esc(c.skip.why)}</span></p>` : ''}
      <p class="notice ask-tonight">${icon('leaf')}<span><strong>${esc(t('sw_tip'))}:</strong> ${esc(c.tip)}</span></p>`,
  };
}

function recipeBody(data) {
  const c = data.card;
  const rows = (c.changes || []).map((x) => `<tr><td data-label="${esc(t('from'))}">${esc(x.from)}</td><td data-label="${esc(t('to'))}"><strong>${esc(x.to)}</strong></td><td data-label="${esc(t('why'))}">${esc(x.why)}</td></tr>`).join('');
  return {
    title: c.title,
    tag: '',
    lead: `<p class="result-summary">${esc(c.intro)}</p>`,
    body: `
      ${rows ? `<h4 class="result-sub">${esc(t('sw_changes'))}</h4>
      <div class="table-wrap"><table class="data-table stack-table"><thead><tr><th scope="col">${esc(t('from'))}</th><th scope="col">${esc(t('to'))}</th><th scope="col">${esc(t('why'))}</th></tr></thead><tbody>${rows}</tbody></table></div>` : ''}
      <div class="result-cols">
        ${c.ingredients?.length ? `<div><h4 class="result-sub">${esc(t('ingredients_h'))}</h4><ul class="ask-ing">${c.ingredients.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div>` : ''}
        ${c.steps?.length ? `<div><h4 class="result-sub">${esc(t('sw_steps'))}</h4><ol class="ask-steps">${c.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol></div>` : ''}
      </div>
      ${c.keep_flavor?.length ? `<h4 class="result-sub">${esc(t('sw_keep_flavor'))}</h4>${tipList(c.keep_flavor.map(esc))}` : ''}`,
  };
}

const BODY = { swap: swapBody, eatout: eatoutBody, recipe: recipeBody };

function renderResult(data, focus = true) {
  result().dataset.state = 'result';
  result().setAttribute('aria-busy', 'false');
  const part = BODY[data.mode](data);
  const note = data.coverage === 'guidelines' && data.mode === 'swap' ? `<p class="muted">${esc(t('sw_not_in_list'))}</p>` : '';
  result().innerHTML = `
    <div class="result-head">
      <div><p class="eyebrow">${esc(t(`sw_mode_${data.mode}`))}</p><h3 class="result-title" tabindex="-1">${esc(part.title)}</h3></div>
      <span class="source-tag source-tag--ai">${icon('sparkle')}${esc(t('sw_ai_tag'))}</span>
    </div>
    ${part.tag ? `<p>${part.tag}</p>` : ''}
    ${part.lead}
    ${note}
    ${part.body}
    ${data.card.heads_up ? `<p class="notice ask-headsup">${icon('alert')}<span><strong>${esc(t('sw_heads_up'))}:</strong> ${esc(data.card.heads_up)}</span></p>` : ''}
    ${sourcesBlock(data)}
    <div class="ask-actions"><button class="button button--secondary" type="button" data-ask-copy>${esc(t('sw_copy'))}</button></div>
    ${inlineJoinHtml()}
    <p class="notice">${icon('info')}<span>${esc(t('sw_disclaimer'))}</span></p>`;
  $('[data-ask-copy]', result()).addEventListener('click', async () => toast(t((await copyText(cardText(data))) ? 'sw_copied' : 'sw_copy_failed')));
  if (focus) {
    $('.result-title', result()).focus({ preventScroll: true });
    if (stacked()) reveal(result());
  }
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

/** Plain text for texting a family member. */
function cardText(data) {
  const c = data.card;
  const L = [];
  if (data.mode === 'swap') {
    L.push(c.dish, c.headline, '');
    for (const w of c.watch || []) L.push(`- ${nutrient(w.nutrient)}: ${w.note}`);
    L.push('');
    for (const s of c.swaps || []) L.push(`- ${s.title}: ${s.how}`);
    L.push('', `Tonight: ${c.tonight}`);
  } else if (data.mode === 'eatout') {
    L.push(`Eating out: ${c.restaurant}`, '');
    for (const p of c.picks || []) L.push(`- ${p.item}. Say: "${p.say}"`);
    if (c.skip) L.push('', `Skip: ${c.skip.item} (${c.skip.why})`);
    L.push('', `Tip: ${c.tip}`);
  } else {
    L.push(c.title, c.intro, '');
    for (const x of c.changes || []) L.push(`- ${x.from} -> ${x.to}`);
    if (c.ingredients?.length) L.push('', 'Ingredients:', ...c.ingredients.map((i) => `- ${i}`));
    if (c.steps?.length) L.push('', 'Steps:', ...c.steps.map((s, i) => `${i + 1}. ${s}`));
  }
  if (c.heads_up) L.push('', `Heads up: ${c.heads_up}`);
  L.push('', t('sw_disclaimer'));
  return L.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

async function request(mode, body, what) {
  if (state.busy) return;
  state.busy = true;
  state.last = { mode, body, what };
  const submit = $('[data-ask-submit]');
  submit.disabled = true;
  submit.setAttribute('aria-busy', 'true');
  state.view = { state: 'loading', what };
  paintResult();
  if (stacked()) reveal(result());
  try {
    const res = await fetch(MODES[mode].endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    let data = null;
    try { data = await res.json(); } catch { data = null; }
    if (!res.ok || !data?.card) throw new Error(data?.error || 'FuelWell could not answer just now. Please try again.');
    state.view = { state: 'result', data };
    renderResult(data);
    track('try_finished', mode);
    offerJoin('answer');
  } catch (err) {
    state.view = { state: 'error', message: navigator.onLine === false ? 'You seem to be offline.' : err.message };
    paintResult();
  } finally {
    state.busy = false;
    submit.disabled = false;
    submit.removeAttribute('aria-busy');
  }
}

/** "Personalize for me" on a Browse swaps card: the normal AI swap, tailored to the profile. */
export function personalize(row) {
  state.mode = 'swap';
  setPhoto(null);
  $('#ask-meal').value = row.meal;
  showError('');
  paintForm();
  if (!stacked()) reveal($('[data-ask-form]'));
  request('swap', { meal: row.meal, profile: PROFILE }, row.meal);
}

/* ---------- Wire up ---------- */
let wired = false;
export function initAsk() {
  if (wired) return;
  wired = true;
  $('[data-ask-modes]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-ask-mode]');
    if (!b) return;
    state.mode = b.dataset.askMode;
    showError('');
    paintForm();
  });
  $('[data-ask-form]').addEventListener('click', (e) => {
    const ex = e.target.closest('[data-ask-example]');
    if (!ex) return;
    mainField().value = ex.dataset.askExample;
    showError('');
    mainField().focus();
  });
  $('[data-ask-form]').addEventListener('submit', (e) => {
    e.preventDefault();
    const body = buildBody();
    if (!body) { showError(t(MODES[state.mode].error)); mainField().focus(); return; }
    showError('');
    const what = body.meal || body.restaurant || (body.recipe ? body.recipe.split('\n')[0].slice(0, 60) : '') || t('sw_photo_added');
    request(state.mode, body, what);
  });
  const input = $('[data-ask-photo-input]');
  $('[data-ask-photo-btn]').addEventListener('click', () => input.click());
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try { setPhoto(await shrinkImage(file)); showError(''); } catch { showError(t('sw_photo_bad')); }
  });
  $('[data-ask-photo-remove]').addEventListener('click', () => setPhoto(null));
  // Links like /meals.html?dish=...#ask (from Today) open Family recipe with the dish filled in.
  const dish = new URLSearchParams(location.search).get('dish');
  if (dish) {
    state.mode = 'recipe';
    $('#ask-recipe').value = dish.slice(0, 6000);
    paintForm();
    toast(t('sw_prefilled'));
  }
}

/** Runs on first paint and again whenever the language changes. */
export function renderAsk() {
  paintForm();
  paintResult();
}
