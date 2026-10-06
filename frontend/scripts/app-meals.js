// Meals tab: weekly plan, AI family recipe helper, smart swaps and a printable grocery list.
import { initShell, hydrateIcons } from './app-shell.js';
import { badge, esc, icon, initTabs, nutrientNames, nutrientRow, storage, toast } from './app-ui.js';
import { grocery, mealSlots, recipeExamples, swaps, targets, week } from '../data/fung.js';
import { adaptRecipe } from './ai-client.js';

const $ = (sel, root = document) => root.querySelector(sel);
const todayIndex = (new Date().getDay() + 6) % 7;

/* ---------- This week ---------- */
function weekDates() {
  const monday = new Date();
  monday.setDate(monday.getDate() - todayIndex);
  return week.map((_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d; });
}

function renderWeek() {
  const dates = weekDates();
  const picker = $('[data-day-picker]');
  picker.innerHTML = week.map((day, i) => `
    <button class="day-btn" type="button" data-day="${i}" aria-pressed="${i === todayIndex}" aria-label="${dates[i].toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}${i === todayIndex ? ', today' : ''}">
      <span class="day-name">${day.day}</span><span class="day-num">${dates[i].getDate()}</span>${i === todayIndex ? '<span class="day-dot" aria-hidden="true"></span>' : ''}
    </button>`).join('');
  picker.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-day]');
    if (btn) showDay(Number(btn.dataset.day));
  });
  showDay(todayIndex);
}

function showDay(index) {
  document.querySelectorAll('[data-day]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.day) === index)));
  const plan = week[index];
  const totals = { k: 0, p: 0, na: 0 };
  mealSlots.forEach(({ key }) => ['k', 'p', 'na'].forEach((n) => { totals[n] += plan[key][n]; }));
  const label = new Date(weekDates()[index]).toLocaleDateString('en-US', { weekday: 'long' });
  $('[data-day-summary]').innerHTML = `<p class="day-summary-title"><strong>${label}</strong> · day total</p>
    <ul class="day-totals">${['k', 'p', 'na'].map((n) => {
      const pct = Math.round((totals[n] / targets[n].target) * 100);
      const st = pct > 100 ? ['high', 'Over'] : pct >= 75 ? ['mid', 'Watch'] : ['low', 'OK'];
      return `<li><span>${nutrientNames[n]}</span> <strong>${totals[n].toLocaleString()} mg</strong> <span class="muted">of ${targets[n].target.toLocaleString()}</span> <span class="badge badge--${st[0]}">${st[1]}</span></li>`;
    }).join('')}</ul>`;
  $('[data-week-meals]').innerHTML = mealSlots.map((slot) => {
    const meal = plan[slot.key];
    return `<article class="card meal-card">
      <p class="meal-card-slot"><span class="meal-slot">${slot.label}</span><span class="muted">${slot.time}</span></p>
      <h3 class="meal-name">${esc(meal.name)}</h3>
      <p class="meal-zh-line"><span lang="zh-Hant">${esc(meal.zh)}</span> · <span class="muted">${esc(meal.note)}</span></p>
      ${nutrientRow(meal)}
    </article>`;
  }).join('');
}

/* ---------- Family recipe helper ---------- */
const result = () => $('[data-helper-result]');
let lastInput = null;

function emptyState() {
  result().innerHTML = `<div class="empty">
    <span class="empty-icon">${icon('sparkle')}</span>
    <h3>Your kidney-friendly version will appear here</h3>
    <p class="muted">Pick an example or describe a family dish. You'll see what to swap, why, and how much potassium, phosphorus and sodium it saves.</p>
  </div>`;
}

function loadingState(dish) {
  result().setAttribute('aria-busy', 'true');
  result().innerHTML = `<div class="loading-block">
    <p class="loading-title"><span class="spinner" aria-hidden="true"></span>Adapting “${esc(dish)}”…</p>
    <p class="muted">Matching ingredients to USDA nutrient data and checking swaps.</p>
    <div class="sk sk-line"></div><div class="sk sk-line sk-line--short"></div><div class="sk sk-block"></div><div class="sk sk-line"></div>
  </div>`;
}

function errorState(error) {
  result().setAttribute('aria-busy', 'false');
  result().innerHTML = `<div class="state-error" role="alert">
    <span class="empty-icon empty-icon--error">${icon('alert')}</span>
    <h3>The recipe helper couldn't finish</h3>
    <p>${esc(error?.message || 'Something went wrong.')} Your dish is still in the box, so you can try again in a moment.</p>
    <button class="button" type="button" data-retry>${icon('retry')}Try again</button>
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
      <div class="cmp-head"><strong>${nutrientNames[n]}</strong>${badge(levels?.[n], 'Now')}<span class="cmp-change">${change <= 0 ? `${Math.abs(change)}% less` : `${change}% more`}</span></div>
      <div class="cmp-line"><span class="cmp-tag">Before</span><span class="cmp-track"><span class="cmp-fill cmp-fill--before" style="width:${(b / max) * 100}%"></span></span><span class="cmp-num">${fmtMg(b)}</span></div>
      <div class="cmp-line"><span class="cmp-tag">After</span><span class="cmp-track"><span class="cmp-fill" style="width:${(a / max) * 100}%"></span></span><span class="cmp-num">${fmtMg(a)}</span></div>
    </div>`;
  }).join('');
}

function renderResult(r) {
  result().setAttribute('aria-busy', 'false');
  const ai = r.source === 'ai';
  const swapsRows = (r.swaps || []).map((s) => `<tr><td data-label="From">${esc(s.from)}</td><td data-label="To"><strong>${esc(s.to)}</strong></td><td data-label="Why">${esc(s.why)}</td></tr>`).join('');
  const ingredients = (r.ingredients || []).map((i) => `<li class="ing">
      <span class="ing-name">${esc(i.name)}${i.swapped_from && i.swapped_from.toLowerCase() !== i.name.toLowerCase() ? ` <span class="chip chip--clay">was ${esc(i.swapped_from)}</span>` : ''}</span>
      <span class="ing-amt">${Math.round(Number(i.amount_g) || 0)} g</span>
      <span class="ing-nutri muted">K ${Math.round(i.k_mg)} · P ${Math.round(i.p_mg)} · Na ${Math.round(i.na_mg)} mg</span>
    </li>`).join('');
  result().innerHTML = `
    <div class="result-head">
      <div><p class="eyebrow">Kidney-friendly version</p><h3 class="result-title" tabindex="-1">${esc(r.adapted_name)}</h3><p class="muted">Adapted from ${esc(r.dish)}</p></div>
      <span class="source-tag source-tag--${ai ? 'ai' : 'rules'}">${icon(ai ? 'sparkle' : 'list')}${ai ? 'Generated by AI with nutrient math from USDA data' : 'Rule-based, with USDA nutrient data'}</span>
    </div>
    ${r.summary ? `<p class="result-summary">${esc(r.summary)}</p>` : ''}
    <h4 class="result-sub">Before and after, per serving</h4>
    <div class="cmp">${comparison(r.totals_before, r.totals_after, r.levels_after)}</div>
    ${swapsRows ? `<h4 class="result-sub">Swaps</h4>
    <div class="table-wrap"><table class="data-table stack-table"><thead><tr><th scope="col">From</th><th scope="col">To</th><th scope="col">Why</th></tr></thead><tbody>${swapsRows}</tbody></table></div>` : ''}
    <div class="result-cols">
      ${ingredients ? `<div><h4 class="result-sub">Adapted ingredients</h4><ul class="ing-list">${ingredients}</ul></div>` : ''}
      ${(r.tips || []).length ? `<div><h4 class="result-sub">Cooking tips</h4><ul class="tip-list">${r.tips.map((t) => `<li>${icon('check')}<span>${esc(t)}</span></li>`).join('')}</ul></div>` : ''}
    </div>
    <p class="notice">${icon('info')}<span>${esc(r.disclaimer || 'Sample guidance only. Check with your renal dietitian before changing a diet.')}</span></p>`;
  $('.result-title', result()).focus({ preventScroll: true });
}

async function runHelper(input) {
  if (!input) return;
  lastInput = input;
  const submit = $('[data-helper-submit]');
  submit.setAttribute('aria-busy', 'true');
  submit.disabled = true;
  loadingState(input.dish);
  try {
    renderResult(await adaptRecipe(input));
  } catch (error) {
    errorState(error);
  } finally {
    submit.removeAttribute('aria-busy');
    submit.disabled = false;
  }
}

function initHelper() {
  const form = $('[data-helper-form]');
  const dish = $('#dish');
  const cuisine = $('#cuisine');
  const err = $('#dish-error');
  $('[data-recipe-examples]').innerHTML = recipeExamples.map((ex, i) => `<button class="chip-button" type="button" data-example="${i}">${esc(ex.label)}</button>`).join('');
  form.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-example]');
    if (!btn) return;
    const ex = recipeExamples[Number(btn.dataset.example)];
    dish.value = ex.dish;
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
  emptyState();
}

/* ---------- Smart swaps ---------- */
const cuisineLabel = { chinese: 'Chinese', korean: 'Korean', vietnamese: 'Vietnamese' };

function renderSwaps(filter = 'all') {
  document.querySelectorAll('[data-cuisine]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cuisine === filter)));
  $('[data-swap-rows]').innerHTML = swaps
    .filter((s) => filter === 'all' || s.cuisine === filter)
    .map((s) => `<tr>
      <td data-label="Limit"><span class="swap-limit">${icon('x')}<strong>${esc(s.limit)}</strong></span><span class="chip swap-cuisine">${cuisineLabel[s.cuisine]}</span></td>
      <td data-label="Choose instead"><span class="swap-choose">${icon('check')}${esc(s.choose)}</span></td>
      <td data-label="Why it matters">${esc(s.why)}</td>
    </tr>`).join('');
}

/* ---------- Grocery list ---------- */
const GROCERY_KEY = 'fuelwell.grocery.v1';

function renderGrocery() {
  const checked = new Set(storage().get(GROCERY_KEY, []));
  const total = grocery.reduce((sum, a) => sum + a.items.length, 0);
  const updateCount = () => {
    const n = document.querySelectorAll('[data-grocery] input:checked').length;
    $('[data-grocery-count]').textContent = `${n} of ${total} items in the basket`;
  };
  $('[data-aisles]').innerHTML = grocery.map((aisle, a) => `
    <fieldset class="aisle">
      <legend>${esc(aisle.aisle)} <span class="muted">(${aisle.items.length})</span></legend>
      <ul>${aisle.items.map((item, i) => {
        const id = `g-${a}-${i}`;
        return `<li><label class="check" for="${id}"><input type="checkbox" id="${id}" value="${esc(item)}"${checked.has(item) ? ' checked' : ''}><span>${esc(item)}</span></label></li>`;
      }).join('')}</ul>
    </fieldset>`).join('');
  $('[data-aisles]').addEventListener('change', () => {
    storage().set(GROCERY_KEY, [...document.querySelectorAll('[data-grocery] input:checked')].map((c) => c.value));
    updateCount();
  });
  $('[data-print]').addEventListener('click', () => window.print());
  updateCount();
}

initShell({ page: 'meals' }).then((ctx) => {
  if (!ctx) return;
  renderWeek();
  initHelper();
  renderSwaps();
  $('[data-swap-filter]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cuisine]');
    if (b) renderSwaps(b.dataset.cuisine);
  });
  renderGrocery();
  hydrateIcons(document);
  initTabs($('[role="tablist"]'));
  if (new URLSearchParams(location.search).get('dish')) toast('We filled in the dish for you. Press “Make it kidney-friendly” when ready.');
});
