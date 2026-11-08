// Notes: every weekly guide and meal plan, doctor and dietitian notes, meal plans saved
// from AI Chat and swaps saved from Meals > Browse swaps, grouped by week.
// Each note shows who wrote it and when.
import { initShell } from '../app-shell.js';
import { dateFromOffset, esc, fmt, icon } from '../app-ui.js';
import { tr } from '../i18n.js';
import { mealSlots, week } from '../../data/fung.js';
import { careNotes, noteAuthors } from '../../data/portal.js';
import { savedNotes } from './chat-store.js';
import { removeSwap, savedSwaps } from '../swap-store.js';
import { photoUrl, swapPhotos } from '../../data/swap-photos.js';
import { fillPortalText, pt } from './strings.js';

const $ = (sel) => document.querySelector(sel);

const FILTERS = {
  all: () => true,
  food: (n) => ['guide', 'plan', 'ai', 'swap'].includes(n.type),
  team: (n) => ['dietitian', 'doctor'].includes(n.type),
};
const FILTER_LABELS = { all: 'filter_all', food: 'filter_food', team: 'filter_team' };
const TYPE_ICONS = { guide: 'leaf', plan: 'week', dietitian: 'care', doctor: 'health', ai: 'sparkle', swap: 'heart' };
let filter = 'all';

function mondayOf(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

const threeMeals = mealSlots.filter((slot) => slot.key !== 'snack');

// Care-team plans list Fung's week from fung.js, one row per weekday of the note's week.
function carePlanDays(note) {
  const monday = mondayOf(note.at);
  return note.plan.days.map((dayIndex, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return { label: fmt.weekday(date), meals: threeMeals.map((slot) => ({ slot: slot.label, name: week[dayIndex][slot.key].name })) };
  });
}

function allNotes() {
  const team = careNotes.map((n) => ({ ...n, at: dateFromOffset(-n.daysAgo, n.h, n.m) }));
  const fromAi = savedNotes().map((n) => ({ id: n.id, type: 'ai', at: new Date(n.savedAt), title: n.plan.title, aiPlan: n.plan }));
  const swaps = savedSwaps().map((w) => ({ id: `swap-${w.id}`, type: 'swap', at: new Date(w.savedAt), title: w.meal, swap: w }));
  return [...team, ...fromAi, ...swaps].sort((a, b) => b.at - a.at);
}

function planList(days) {
  return `<ol class="plan-days note-plan">${days.map((d) => `<li><h4>${esc(tr(d.label))}</h4>
    <ul>${d.meals.map((meal) => `<li><span class="plan-slot">${esc(tr(meal.slot))}</span> ${esc(tr(meal.name))}</li>`).join('')}</ul></li>`).join('')}</ol>`;
}

function byline(note) {
  if (note.type === 'swap') {
    return `<p class="note-byline"><span class="avatar ai-avatar" aria-hidden="true">${icon('heart')}</span>
      <span><strong>${esc(pt('swap_saved_by'))}</strong><span class="note-date">${esc(pt('saved_on', { date: fmt.date(note.at) }))}</span></span></p>`;
  }
  if (note.type === 'ai') {
    return `<p class="note-byline"><span class="avatar ai-avatar" aria-hidden="true">${icon('sparkle')}</span>
      <span><strong>${esc(pt('ai_name'))}</strong><span class="note-date">${esc(pt('saved_on', { date: fmt.date(note.at) }))}</span></span></p>`;
  }
  const a = noteAuthors[note.author];
  return `<p class="note-byline"><span class="avatar avatar--${a.tone}" aria-hidden="true">${esc(a.initials)}</span>
    <span><strong>${esc(tr(a.name))}</strong> · ${esc(tr(a.role))}<span class="note-date">${esc(pt('written_on', { date: fmt.date(note.at) }))}</span></span></p>`;
}

const NUTRIENT = { Na: 'sodium', K: 'potassium', P: 'phosphorus' };

function swapCard(note) {
  const w = note.swap;
  const photo = swapPhotos[w.meal];
  return `<article class="card note-card note-card--swap" aria-labelledby="note-${esc(note.id)}">
    <div class="note-top">
      <span class="note-type">${icon('heart')}${esc(pt('type_swap'))}</span>
      <span class="note-flag">${icon('alert')}${esc(pt('swap_flag'))}</span>
    </div>
    <div class="note-swap">
      ${photo ? `<img class="note-swap-photo" src="${esc(photoUrl(photo, 320, 240))}" alt="" loading="lazy" width="160" height="120">` : ''}
      <div>
        <h3 id="note-${esc(note.id)}">${esc(w.meal)}</h3>
        ${byline(note)}
        <p class="note-summary"><strong>${esc(pt('swap_try'))}</strong> ${esc(w.swap)}</p>
      </div>
    </div>
    <details class="note-more"><summary>${icon('chevron')}${esc(pt('read_more'))}</summary><div class="note-body">
      <p><strong>${esc(pt('swap_why'))}</strong> ${esc(w.why)}</p>
      ${w.watch?.length ? `<p><strong>${esc(pt('swap_watch'))}</strong> ${w.watch.map((n) => esc(NUTRIENT[n] ? pt(NUTRIENT[n]) : n)).join(', ')}</p>` : ''}
      <p class="note-swap-actions"><a class="link-arrow" href="/meals.html#browse">${esc(pt('swap_open'))} ${icon('arrow')}</a>
        <button class="button button--ghost" type="button" data-unsave-swap="${esc(w.id)}">${icon('x')}${esc(pt('swap_remove'))}</button></p>
    </div></details>
  </article>`;
}

function noteCard(note) {
  if (note.type === 'swap') return swapCard(note);
  const ai = note.type === 'ai';
  const full = [
    ...(note.body || []).map((p) => `<p>${esc(tr(p))}</p>`),
    note.tips ? `<ul class="note-tips">${note.tips.map((tip) => `<li>${icon('check')}<span>${esc(tr(tip))}</span></li>`).join('')}</ul>` : '',
    note.plan ? planList(carePlanDays(note)) : '',
    ai ? planList(note.aiPlan.days) : '',
    ai ? `<p><a class="link-arrow" href="/care-team.html#messages">${esc(pt('ask_mei_review'))} ${icon('arrow')}</a></p>` : '',
  ].join('');
  return `<article class="card note-card${ai ? ' note-card--ai' : ''}" aria-labelledby="note-${esc(note.id)}">
    <div class="note-top">
      <span class="note-type">${icon(TYPE_ICONS[note.type])}${esc(pt(`type_${note.type}`))}</span>
      ${ai ? `<span class="note-flag">${icon('alert')}${esc(pt('not_reviewed'))}</span>` : `<span class="reviewed">${icon('check')}${esc(pt('from_care_team'))}</span>`}
    </div>
    <h3 id="note-${esc(note.id)}">${esc(tr(note.title))}</h3>
    ${byline(note)}
    <p class="note-summary">${esc(ai ? pt('ai_note_summary') : tr(note.summary))}</p>
    <details class="note-more"><summary>${icon('chevron')}${esc(pt('read_more'))}</summary><div class="note-body">${full}</div></details>
  </article>`;
}

function renderFilters() {
  const box = $('[data-note-filters]');
  box.innerHTML = Object.keys(FILTERS).map((key) => `<button class="subtab" type="button" data-filter="${key}" aria-pressed="${key === filter}">${esc(pt(FILTER_LABELS[key]))}</button>`).join('');
}

function renderNotes() {
  const notes = allNotes().filter(FILTERS[filter]);
  const thisWeek = mondayOf(new Date()).getTime();
  const weeks = new Map();
  notes.forEach((n) => {
    const key = mondayOf(n.at).getTime();
    if (!weeks.has(key)) weeks.set(key, []);
    weeks.get(key).push(n);
  });
  $('[data-notes]').innerHTML = [...weeks].map(([key, list]) => `<section class="notes-week" aria-labelledby="week-${key}">
      <h2 id="week-${key}">${esc(pt('week_of', { date: fmt.date(new Date(key)) }))}${key === thisWeek ? ` <span class="week-now">${esc(pt('this_week'))}</span>` : ''}</h2>
      <div class="notes-list">${list.map(noteCard).join('')}</div>
    </section>`).join('') || `<p class="empty">${esc(pt('notes_empty'))}</p>`;
}

let wired = false;
initShell({
  page: 'notes',
  render() {
    document.title = pt('notes_title');
    fillPortalText();
    renderFilters();
    renderNotes();
    if (!wired) {
      wired = true;
      $('[data-note-filters]').addEventListener('click', (e) => {
        const b = e.target.closest('[data-filter]');
        if (!b) return;
        filter = b.dataset.filter;
        renderFilters();
        renderNotes();
        $(`[data-filter="${filter}"]`).focus();
      });
      $('[data-notes]').addEventListener('click', (e) => {
        const b = e.target.closest('[data-unsave-swap]');
        if (!b) return;
        removeSwap(b.dataset.unsaveSwap);
        renderNotes();
      });
    }
  },
});
