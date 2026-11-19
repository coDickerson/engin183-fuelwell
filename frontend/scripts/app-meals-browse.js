// Meals > "Browse swaps": photo cards from FuelWell's swap catalog (GET /api/catalog, no AI).
// Each card: the dish photo, Instead of -> Try, why, what to watch, ♡ Save (goes to Notes)
// and "Personalize for me" (runs the AI swap in the "Swap & eat out" sub-tab).
import { esc, icon, toast } from './app-ui.js';
import { t } from './app-strings.js';
import { photoPage, photoUrl, swapPhotos } from '../data/swap-photos.js';
import { isSwapSaved, savedSwaps, toggleSwap } from './swap-store.js';
import { personalize } from './app-meals-ask.js';
import { track } from './track.js';
import { offerJoin } from './signup-nudge.js';

const $ = (sel, root = document) => root.querySelector(sel);
const KINDS = { takeout: 'br_takeout', frozen: 'br_frozen', home: 'br_home' };
const NUTRIENT_KEY = { Na: 'sodium', K: 'potassium', P: 'phosphorus' };
const nutrient = (n) => (NUTRIENT_KEY[n] ? `${n} · ${t(NUTRIENT_KEY[n])}` : n);
const cuisineGroup = (c) => String(c || '').split(/\s*[/-]\s*/)[0].replace(/\s+fast food$/i, '').trim();

const state = { rows: null, failed: false, kind: 'all', cuisine: 'all' };

function card(r, index) {
  const photo = swapPhotos[r.meal];
  const cuisine = cuisineGroup(r.cuisine);
  const saved = isSwapSaved(r.id);
  return `<li><article class="swap-card" aria-labelledby="swap-${index}">
    <div class="swap-card-photo">
      ${photo ? `<img src="${esc(photoUrl(photo))}" alt="" loading="lazy" width="640" height="420">` : `<span class="swap-card-nophoto">${icon('leaf')}</span>`}
      <span class="chip chip--plain swap-card-kind">${esc(KINDS[r.eater_type] ? t(KINDS[r.eater_type]) : r.eater_type)}${cuisine && cuisine !== 'Any' ? ` · ${esc(cuisine)}` : ''}</span>
      <button class="swap-card-save" type="button" data-save-swap="${index}" aria-pressed="${saved}" aria-label="${esc(t(saved ? 'br_unsave' : 'br_save'))}: ${esc(r.meal)}">${icon('heart')}</button>
    </div>
    <div class="swap-card-body">
      <p class="instead-label">${esc(t('br_instead'))}</p>
      <h3 id="swap-${index}">${esc(r.meal)}</h3>
      ${r.watch?.length ? `<p class="ask-badges">${r.watch.map((n) => `<span class="chip chip--plain">${esc(nutrient(n))}</span>`).join('')}</p>` : ''}
    </div>
    <div class="swap-card-try">
      <p class="instead-label">${icon('arrow')}${esc(t('br_try'))}</p>
      <p class="swap-card-swap">${esc(r.swap)}</p>
      <p class="muted"><strong>${esc(t('br_why'))}:</strong> ${esc(r.why)}</p>
      ${r.portion ? `<p class="muted"><strong>${esc(t('sw_portion'))}:</strong> ${esc(r.portion)}</p>` : ''}
    </div>
    <div class="swap-card-actions">
      <button class="button button--secondary" type="button" data-save-swap="${index}" aria-pressed="${saved}">${icon('heart')}<span>${esc(t(saved ? 'br_saved' : 'br_save'))}</span></button>
      <button class="button" type="button" data-personalize="${index}">${icon('sparkle')}<span>${esc(t('br_personalize'))}</span></button>
    </div>
    ${photo ? `<p class="swap-card-credit">${esc(t('br_photo_by'))} <a href="${esc(photoPage(photo))}" target="_blank" rel="noopener noreferrer">${esc(photo.by)}</a> / Unsplash</p>` : ''}
  </article></li>`;
}

function paint() {
  const count = $('[data-browse-count]');
  if (state.failed) { count.textContent = t('br_failed'); return; }
  if (!state.rows) { count.textContent = t('br_loading'); return; }
  const savedIds = new Set(savedSwaps().map((s) => s.id));
  const kinds = [['all', t('br_all')], ...Object.entries(KINDS).map(([k, key]) => [k, t(key)]), ['saved', `${t('br_saved_filter')} (${savedIds.size})`]];
  $('[data-browse-kind]').innerHTML = kinds.map(([k, label]) => `<button class="filter" type="button" data-browse-kind-btn="${k}" aria-pressed="${state.kind === k}">${k === 'saved' ? icon('heart') : ''}${esc(label)}</button>`).join('');
  const cuisines = [...new Set(state.rows.map((r) => cuisineGroup(r.cuisine)).filter((c) => c && c !== 'Any'))].sort();
  $('[data-browse-cuisine]').innerHTML = [['all', t('br_all_cuisines')], ...cuisines.map((c) => [c, c])]
    .map(([c, label]) => `<button class="filter" type="button" data-browse-cuisine-btn="${esc(c)}" aria-pressed="${state.cuisine === c}">${esc(label)}</button>`).join('');
  const shown = state.rows
    .map((r, i) => [r, i])
    .filter(([r]) => (state.kind === 'all' || (state.kind === 'saved' ? savedIds.has(r.id) : r.eater_type === state.kind))
      && (state.cuisine === 'all' || cuisineGroup(r.cuisine) === state.cuisine));
  count.textContent = `${t('br_count', { n: shown.length })} · ${t('br_english_note')}`;
  $('[data-browse-grid]').innerHTML = shown.length
    ? shown.map(([r, i]) => card(r, i)).join('')
    : `<li class="muted">${esc(t(state.kind === 'saved' ? 'br_none_saved' : 'br_none'))}</li>`;
}

async function load() {
  try {
    const res = await fetch('/api/catalog');
    const data = await res.json();
    if (!res.ok || !Array.isArray(data.rows)) throw new Error('bad response');
    state.rows = data.rows;
  } catch {
    state.failed = true;
  }
  paint();
}

let wired = false;
export function initBrowse() {
  if (wired) return;
  wired = true;
  const panel = $('#panel-browse');
  panel.addEventListener('click', (e) => {
    const kind = e.target.closest('[data-browse-kind-btn]');
    if (kind) { state.kind = kind.dataset.browseKindBtn; paint(); return; }
    const cuisine = e.target.closest('[data-browse-cuisine-btn]');
    if (cuisine) { state.cuisine = cuisine.dataset.browseCuisineBtn; paint(); return; }
    const save = e.target.closest('[data-save-swap]');
    if (save) {
      const index = save.dataset.saveSwap;
      const now = toggleSwap(state.rows[Number(index)]);
      toast(t(now ? 'br_saved_toast' : 'br_unsaved_toast'));
      if (now) { track('swap_saved', state.rows[Number(index)].meal); offerJoin('save'); }
      paint();
      $(`.swap-card-actions [data-save-swap="${index}"]`)?.focus();
      return;
    }
    const go = e.target.closest('[data-personalize]');
    if (go) {
      $('#tab-ask').click();
      personalize(state.rows[Number(go.dataset.personalize)]);
    }
  });
  load();
}

/** Runs on first paint and again whenever the language changes. */
export function renderBrowse() {
  paint();
}
