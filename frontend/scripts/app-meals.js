// Meals tab: "Swap & eat out" (app-meals-ask.js), a printable grocery list,
// "Browse swaps" (app-meals-browse.js) and the weekly plan.
import { initShell } from './app-shell.js';
import { esc, fmt, icon, initTabs, storage } from './app-ui.js';
import { grocery, mealSlots, persona, week } from '../data/fung.js';
import { initStoreFinder } from './store-finder.js';
import { initAsk, renderAsk, setAskAccount } from './app-meals-ask.js';
import { initBrowse, renderBrowse } from './app-meals-browse.js';
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
    </article>`;
  }).join('');
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
  $('[data-aisles]').addEventListener('change', () => {
    storage().set(GROCERY_KEY, [...document.querySelectorAll('[data-grocery] input:checked')].map((c) => c.value));
    updateCount();
  });
  $('[data-print]').addEventListener('click', () => window.print());
  initStoreFinder();
  initAsk();
  initBrowse();
  initTabs($('[role="tablist"]'));
}

initShell({
  page: 'meals',
  title: 'title_meals',
  render(ctx) {
    setAskAccount(ctx);
    renderWeek();
    renderGrocery();
    renderAsk();
    renderBrowse();
    wireOnce();
  },
});
