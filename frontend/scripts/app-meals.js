// Meals tab: weekly plan, AI recipe adapter, smart swaps and a printable grocery list.
import { initShell } from './app-shell.js';
import { badge, esc, fmt, icon, initTabs, nutrientName, nutrientRow, storage, toast } from './app-ui.js';
import { grocery, mealSlots, persona, recipeExamples, swaps, week } from '../data/fung.js';
import { adaptRecipe } from './ai-client.js';
import { initStoreFinder } from './store-finder.js';
import { lang, tr } from './i18n.js';
import { t } from './app-strings.js';

const $ = (sel, root = document) => root.querySelector(sel);
const todayIndex = (new Date().getDay() + 6) % 7;
let selectedDay = todayIndex;

/* ---------- This week ---------- */
function weekDates() {
  const monday = new Date();
  monday.setDate(monday.getDate() - todayIndex);
  return week.map((_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d; });
}

function renderWeek() {
  const dates = weekDates();
  $('[data-reviewed]').innerHTML = `<span class="reviewed">${icon('check')}${esc(t('reviewed_by', { name: persona.dietitian.name }))}</span>`;
  $('[data-day-picker]').innerHTML = dates.map((d, i) => `
    <button class="day-btn" type="button" data-day="${i}" aria-pressed="${i === selectedDay}" aria-label="${esc(fmt.day(d))}${i === todayIndex ? esc(t('today_suffix')) : ''}">
      <span class="day-name">${esc(fmt.weekdayShort(d))}</span><span class="day-num">${d.getDate()}</span>${i === todayIndex ? '<span class="day-dot" aria-hidden="true"></span>' : ''}
    </button>`).join('');
  showDay(selectedDay);
}

function showDay(index) {
  selectedDay = index;
  document.querySelectorAll('[data-day]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.day) === index)));
  const plan = week[index];
  const showDish = lang() !== 'zh';
  $('[data-week-meals]').innerHTML = mealSlots.map((slot) => {
    const meal = plan[slot.key];
    return `<article class="card meal-card">
      <p class="meal-card-slot"><span class="meal-slot">${esc(tr(slot.label))}</span><span class="muted">${fmt.clock(slot.h, slot.m)}</span></p>
      <h3 class="meal-name">${esc(tr(meal.name))}</h3>
      ${showDish ? `<p class="meal-dish" lang="zh-Hant">${esc(meal.dish)}</p>` : ''}
      <p class="meal-note">${esc(tr(meal.note))}</p>
      ${nutrientRow(meal)}
    </article>`;
  }).join('');
}

/* ---------- Recipe adapter ---------- */
const result = () => $('[data-helper-result]');
let lastInput = null;
let view = { state: 'empty' };

function paintResult() {
  if (view.state === 'empty') emptyState();
  else if (view.state === 'loading') loadingState(view.dish);
  else if (view.state === 'error') errorState(view.error);
  else renderResult(view.result, false);
}

function emptyState() {
  result().innerHTML = `<div class="empty">
    <span class="empty-icon">${icon('sparkle')}</span>
    <h3>${esc(t('helper_empty_title'))}</h3>
    <p class="muted">${esc(t('helper_empty_body'))}</p>
  </div>`;
}

function loadingState(dish) {
  result().setAttribute('aria-busy', 'true');
  result().innerHTML = `<div class="loading-block">
    <p class="loading-title"><span class="spinner" aria-hidden="true"></span>${esc(t('helper_loading', { dish }))}</p>
    <p class="muted">${esc(t('helper_loading_sub'))}</p>
    <div class="sk sk-line"></div><div class="sk sk-line sk-line--short"></div><div class="sk sk-block"></div><div class="sk sk-line"></div>
  </div>`;
}

function errorState(error) {
  result().setAttribute('aria-busy', 'false');
  result().innerHTML = `<div class="state-error" role="alert">
    <span class="empty-icon empty-icon--error">${icon('alert')}</span>
    <h3>${esc(t('helper_error_title'))}</h3>
    <p>${esc(t('helper_error_body', { msg: error?.message || '' }))}</p>
    <button class="button" type="button" data-retry>${icon('retry')}${esc(t('try_again'))}</button>
  </div>`;
  $('[data-retry]').addEventListener('click', () => runHelper(lastInput));
}

const fmtMg = (n) => `${Math.round(Number(n) || 0).toLocaleString()} mg`;

function comparison(before, after, levels) {
  return ['k', 'p', 'na'].map((n) => {
    const key = `${n}_mg`;
    const b = Number(before?.[key]) || 0;
    const a = Number(after?.[key]) || 0;
    const max = Math.max(b, a, 1);
    const change = b ? Math.round(((a - b) / b) * 100) : 0;
    return `<div class="cmp-row">
      <div class="cmp-head"><strong>${esc(nutrientName(n))}</strong>${badge(levels?.[n], t('now'))}<span class="cmp-change">${esc(change <= 0 ? t('less', { n: Math.abs(change) }) : t('more', { n: change }))}</span></div>
      <div class="cmp-line"><span class="cmp-tag">${esc(t('before'))}</span><span class="cmp-track"><span class="cmp-fill cmp-fill--before" style="width:${(b / max) * 100}%"></span></span><span class="cmp-num">${fmtMg(b)}</span></div>
      <div class="cmp-line"><span class="cmp-tag">${esc(t('after'))}</span><span class="cmp-track"><span class="cmp-fill" style="width:${(a / max) * 100}%"></span></span><span class="cmp-num">${fmtMg(a)}</span></div>
    </div>`;
  }).join('');
}

function renderResult(r, focus = true) {
  result().setAttribute('aria-busy', 'false');
  const ai = r.source === 'ai';
  const swapsRows = (r.swaps || []).map((s) => `<tr><td data-label="${esc(t('from'))}">${esc(s.from)}</td><td data-label="${esc(t('to'))}"><strong>${esc(s.to)}</strong></td><td data-label="${esc(t('why'))}">${esc(s.why)}</td></tr>`).join('');
  const ingredients = (r.ingredients || []).map((i) => `<li class="ing">
      <span class="ing-name">${esc(i.name)}${i.swapped_from && i.swapped_from.toLowerCase() !== i.name.toLowerCase() ? ` <span class="chip chip--clay">${esc(t('was', { x: i.swapped_from }))}</span>` : ''}</span>
      <span class="ing-amt">${Math.round(Number(i.amount_g) || 0)} g</span>
      <span class="ing-nutri muted">K ${Math.round(i.k_mg)} · P ${Math.round(i.p_mg)} · Na ${Math.round(i.na_mg)} mg</span>
    </li>`).join('');
  result().innerHTML = `
    <div class="result-head">
      <div><p class="eyebrow">${esc(t('result_eyebrow'))}</p><h3 class="result-title" tabindex="-1">${esc(r.adapted_name)}</h3><p class="muted">${esc(t('result_from', { dish: r.dish }))}</p></div>
      <span class="source-tag source-tag--${ai ? 'ai' : 'rules'}">${icon(ai ? 'sparkle' : 'list')}${esc(t(ai ? 'result_ai' : 'result_rules'))}</span>
    </div>
    ${r.summary ? `<p class="result-summary">${esc(r.summary)}</p>` : ''}
    <h4 class="result-sub">${esc(t('before_after'))}</h4>
    <div class="cmp">${comparison(r.totals_before, r.totals_after, r.levels_after)}</div>
    ${swapsRows ? `<h4 class="result-sub">${esc(t('swaps_h'))}</h4>
    <div class="table-wrap"><table class="data-table stack-table"><thead><tr><th scope="col">${esc(t('from'))}</th><th scope="col">${esc(t('to'))}</th><th scope="col">${esc(t('why'))}</th></tr></thead><tbody>${swapsRows}</tbody></table></div>` : ''}
    <div class="result-cols">
      ${ingredients ? `<div><h4 class="result-sub">${esc(t('ingredients_h'))}</h4><ul class="ing-list">${ingredients}</ul></div>` : ''}
      ${(r.tips || []).length ? `<div><h4 class="result-sub">${esc(t('tips_h'))}</h4><ul class="tip-list">${r.tips.map((tip) => `<li>${icon('check')}<span>${esc(tip)}</span></li>`).join('')}</ul></div>` : ''}
    </div>
    <p class="notice">${icon('info')}<span>${esc(t('check_with_rd'))}</span></p>`;
  if (focus) $('.result-title', result()).focus({ preventScroll: true });
}

async function runHelper(input) {
  if (!input) return;
  lastInput = input;
  const submit = $('[data-helper-submit]');
  submit.setAttribute('aria-busy', 'true');
  submit.disabled = true;
  view = { state: 'loading', dish: input.dish };
  paintResult();
  try {
    const r = await adaptRecipe({ ...input, language: lang() });
    view = { state: 'result', result: r };
    renderResult(r);
  } catch (error) {
    view = { state: 'error', error };
    paintResult();
  } finally {
    submit.removeAttribute('aria-busy');
    submit.disabled = false;
  }
}

function renderExamples() {
  $('[data-recipe-examples]').innerHTML = recipeExamples.map((ex, i) => `<button class="chip-button" type="button" data-example="${i}">${esc(tr(ex.label))}</button>`).join('');
}

function initHelper() {
  const form = $('[data-helper-form]');
  const dish = $('#dish');
  const cuisine = $('#cuisine');
  const err = $('#dish-error');
  form.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-example]');
    if (!btn) return;
    const ex = recipeExamples[Number(btn.dataset.example)];
    dish.value = tr(ex.dish);
    cuisine.value = ex.cuisine;
    err.hidden = true;
    dish.removeAttribute('aria-invalid');
    dish.focus();
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = dish.value.trim();
    if (!value) {
      err.hidden = false;
      dish.setAttribute('aria-invalid', 'true');
      dish.focus();
      return;
    }
    err.hidden = true;
    dish.removeAttribute('aria-invalid');
    runHelper({ dish: value, cuisine: cuisine.value });
  });
  const pre = new URLSearchParams(location.search).get('dish');
  if (pre) dish.value = pre.slice(0, 400);
}

/* ---------- Smart swaps ---------- */
const cuisineKey = { chinese: 'cuisine_chinese', korean: 'cuisine_korean', vietnamese: 'cuisine_vietnamese' };
let swapFilter = 'all';

function renderSwaps() {
  document.querySelectorAll('[data-cuisine]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cuisine === swapFilter)));
  $('[data-swap-list]').innerHTML = swaps
    .filter((s) => swapFilter === 'all' || s.cuisine === swapFilter)
    .map((s) => `<li class="swap-item">
      <p class="swap-item-title"><strong>${esc(tr(s.limit))}</strong> <span class="chip chip--plain">${esc(t(cuisineKey[s.cuisine]))}</span></p>
      <p><span class="swap-arrow">${icon('arrow')}</span>${esc(tr(s.choose))}</p>
    </li>`).join('');
}

/* ---------- Grocery list ---------- */
const GROCERY_KEY = 'fuelwell.grocery.v2';
const total = grocery.reduce((sum, a) => sum + a.items.length, 0);

function updateCount() {
  const n = document.querySelectorAll('[data-grocery] input:checked').length;
  $('[data-grocery-sub]').textContent = t('grocery_sub', { count: t('grocery_count', { n, total }) });
}

function renderGrocery() {
  const checked = new Set(storage().get(GROCERY_KEY, []));
  $('[data-aisles]').innerHTML = grocery.map((aisle, a) => `
    <fieldset class="aisle">
      <legend>${esc(tr(aisle.aisle))} <span class="muted">(${aisle.items.length})</span></legend>
      <ul>${aisle.items.map((item, i) => {
        const id = `g-${a}-${i}`;
        return `<li><label class="check" for="${id}"><input type="checkbox" id="${id}" value="${id}"${checked.has(id) ? ' checked' : ''}><span>${esc(tr(item))}</span></label></li>`;
      }).join('')}</ul>
    </fieldset>`).join('');
  updateCount();
}

let wired = false;
function wireOnce() {
  if (wired) return;
  wired = true;
  $('[data-day-picker]').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-day]');
    if (btn) showDay(Number(btn.dataset.day));
  });
  initHelper();
  $('[data-swap-filter]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cuisine]');
    if (b) { swapFilter = b.dataset.cuisine; renderSwaps(); }
  });
  $('[data-aisles]').addEventListener('change', () => {
    storage().set(GROCERY_KEY, [...document.querySelectorAll('[data-grocery] input:checked')].map((c) => c.value));
    updateCount();
  });
  $('[data-print]').addEventListener('click', () => window.print());
  initStoreFinder();
  initTabs($('[role="tablist"]'));
  if (new URLSearchParams(location.search).get('dish')) toast(t('helper_prefilled'));
}

initShell({
  page: 'meals',
  title: 'title_meals',
  render() {
    renderWeek();
    renderExamples();
    paintResult();
    renderSwaps();
    renderGrocery();
    wireOnce();
  },
});
