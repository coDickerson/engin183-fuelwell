// Meals > "Recipes": full recipes from NHLBI (NIH) Healthy Eating Recipes, a U.S. government work in the
// public domain (frontend/public/data/nih-recipes.json, credited on every recipe with a link to the
// original). NHLBI lists sodium and potassium per serving but not phosphorus, so each recipe also flags
// ingredients that are usually high in potassium or phosphorus (NKF patient education). The levels use
// general cutoffs, not anyone's own limits. "Make it kidney-friendly" sends the recipe to the AI Family
// recipe mode, tailored to the profile. Below: links to kidney recipe collections we don't copy.
import { esc, icon } from './app-ui.js';
import { t } from './app-strings.js';
import { askRecipe } from './app-meals-ask.js';

const $ = (sel, root = document) => root.querySelector(sel);

// Per serving. Sodium: FDA "healthy" meals stay near 600 mg; under 300 is a lighter dish.
// Potassium: NKF calls foods under 200 mg low; a whole dish under 250 mg is on the low side.
const LEVELS = {
  sodium: [300, 600],
  potassium: [250, 500],
};
const level = (key, mg) => (mg == null ? 'none' : mg <= LEVELS[key][0] ? 'low' : mg <= LEVELS[key][1] ? 'mid' : 'high');

// Kidney recipe collections we link to (their recipes stay on their sites).
const LINKS = [
  { name: 'National Kidney Foundation', url: 'https://www.kidney.org/nutrition/recipes', key: 'rc_l_nkf' },
  { name: 'American Kidney Fund: Kidney Kitchen', url: 'https://kitchen.kidneyfund.org/', key: 'rc_l_akf' },
  { name: 'DaVita kidney diet recipes', url: 'https://davita.com/diet-nutrition/recipes/', key: 'rc_l_davita' },
  { name: 'Kidney Care UK: Kidney Kitchen', url: 'https://kidneycareuk.org/get-support/healthy-diet-support/kidney-kitchen/', key: 'rc_l_kcuk' },
  { name: 'Kidney Community Kitchen (Canada)', url: 'https://kidneycommunitykitchen.ca/', key: 'rc_l_kck' },
  { name: 'NIDDK: Healthy eating with CKD', url: 'https://www.niddk.nih.gov/health-information/kidney-disease/chronic-kidney-disease-ckd/healthy-eating-adults-chronic-kidney-disease', key: 'rc_l_niddk' },
];

const FILTERS = ['all', 'low_na', 'low_k', 'both'];
const state = { data: null, failed: false, filter: 'all', q: '' };

function stat(key, mg) {
  const lv = level(key, mg);
  const code = key === 'sodium' ? 'Na' : 'K';
  return `<span class="rstat rstat--${lv}">
    <span class="rstat-sym el-sym el--${code}" aria-hidden="true">${code}</span>
    <span><strong>${mg == null ? esc(t('rc_not_listed')) : `${mg} mg`}</strong>${mg == null ? '' : `<span class="rstat-lv">${esc(t(`rc_lv_${lv}`))}</span>`}</span>
    <span class="sr-only">${esc(t(key))}</span>
  </span>`;
}

function matches(r) {
  const lowNa = level('sodium', r.sodium) === 'low';
  const lowK = level('potassium', r.potassium) === 'low';
  if (state.filter === 'low_na' && !lowNa) return false;
  if (state.filter === 'low_k' && !lowK) return false;
  if (state.filter === 'both' && !(lowNa && lowK)) return false;
  if (!state.q) return true;
  const hay = `${r.title} ${r.description} ${r.ingredients.join(' ')}`.toLowerCase();
  return state.q.toLowerCase().split(/\s+/).every((w) => hay.includes(w));
}

function card(r, i) {
  const time = [r.prep, r.cook].filter(Boolean).join(' + ');
  return `<li><article class="recipe-card" aria-labelledby="rc-${i}">
    <p class="recipe-src">${esc(r.source)}</p>
    <h3 id="rc-${i}">${esc(r.title)}</h3>
    <p class="recipe-desc">${esc(r.description)}</p>
    <div class="recipe-stats">${stat('sodium', r.sodium)}${stat('potassium', r.potassium)}</div>
    <p class="recipe-meta">${time ? `${icon('clock')}<span>${esc(time)}</span>` : ''}${r.yields ? `<span>· ${esc(r.yields)}</span>` : ''}</p>
    <div class="recipe-actions">
      <button class="button button--secondary" type="button" data-recipe-open="${esc(r.id)}">${esc(t('rc_view'))}</button>
      <button class="button" type="button" data-recipe-ai="${esc(r.id)}">${icon('sparkle')}<span>${esc(t('rc_ai'))}</span></button>
    </div>
  </article></li>`;
}

function recipeText(r) {
  return [r.title, r.yields && `Makes ${r.yields}; serving ${r.serving || ''}`, '', 'Ingredients:', ...r.ingredients.map((x) => `- ${x}`), '', 'Directions:', ...r.directions.map((x, i) => `${i + 1}. ${x}`)]
    .filter((x) => x !== undefined && x !== null && x !== false).join('\n');
}

function openRecipe(r) {
  const dlg = $('[data-recipe-dialog]');
  const n = r.nutrition || {};
  const rows = ['Calories', 'Protein', 'Carbohydrates', 'Total Fat', 'Sodium', 'Potassium'].filter((k) => n[k]);
  dlg.innerHTML = `<div class="recipe-dialog-inner">
    <div class="recipe-dialog-head">
      <div><p class="eyebrow">${esc(r.source)}</p><h2 id="recipe-dialog-title">${esc(r.title)}</h2></div>
      <button class="icon-button" type="button" data-recipe-close aria-label="${esc(t('rc_close'))}">${icon('x')}</button>
    </div>
    <p class="muted">${esc(r.description)}</p>
    <p class="recipe-meta">${[r.prep && `${t('rc_prep')}: ${r.prep}`, r.cook && `${t('rc_cook')}: ${r.cook}`, r.yields, r.serving && `${t('rc_serving')}: ${r.serving}`].filter(Boolean).map(esc).join(' · ')}</p>
    <div class="recipe-stats">${stat('sodium', r.sodium)}${stat('potassium', r.potassium)}</div>
    ${r.kFlags.length || r.pFlags.length ? `<div class="notice recipe-flags">${icon('alert')}<div>
      ${r.kFlags.length ? `<p><strong>${esc(t('rc_k_flags'))}:</strong> ${esc(r.kFlags.join(', '))}</p>` : ''}
      ${r.pFlags.length ? `<p><strong>${esc(t('rc_p_flags'))}:</strong> ${esc(r.pFlags.join(', '))}</p>` : ''}
      <p class="muted">${esc(t('rc_flags_note'))}</p></div></div>` : ''}
    <div class="recipe-cols">
      <div><h3>${esc(t('rc_ingredients'))}</h3><ul class="recipe-ing">${r.ingredients.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <div><h3>${esc(t('rc_directions'))}</h3><ol class="recipe-steps">${r.directions.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
        ${r.tip ? `<p class="notice">${icon('leaf')}<span><strong>${esc(t('rc_tip'))}:</strong> ${esc(r.tip)}</span></p>` : ''}</div>
    </div>
    <h3>${esc(t('rc_nutrition'))}</h3>
    <table class="data-table recipe-nutrition"><tbody>${rows.map((k) => `<tr><th scope="row">${esc(k)}</th><td>${esc(n[k])}</td></tr>`).join('')}
      <tr><th scope="row">Phosphorus</th><td>${esc(t('rc_not_listed'))}</td></tr></tbody></table>
    <p class="recipe-credit">${esc(t('rc_credit'))} <a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(t('rc_original'))}</a></p>
    <div class="recipe-actions">
      <button class="button" type="button" data-recipe-ai="${esc(r.id)}">${icon('sparkle')}<span>${esc(t('rc_ai'))}</span></button>
      <button class="button button--secondary" type="button" data-recipe-close>${esc(t('rc_close'))}</button>
    </div>
  </div>`;
  dlg.showModal();
  $('[data-recipe-close]', dlg).focus();
}

function paint() {
  const list = $('[data-recipe-list]');
  const count = $('[data-recipe-count]');
  $('[data-recipe-filters]').innerHTML = FILTERS.map((f) => `<button class="filter" type="button" data-recipe-filter="${f}" aria-pressed="${state.filter === f}">${esc(t(`rc_f_${f}`))}</button>`).join('');
  $('[data-recipe-links]').innerHTML = LINKS.map((l) => `<li><a class="recipes-link" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">
      <strong>${esc(l.name)}</strong><span>${esc(t(l.key))}</span><span class="sr-only">${esc(t('res_new_tab'))}</span>${icon('arrow')}</a></li>`).join('');
  if (state.failed) { count.textContent = t('rc_failed'); list.innerHTML = ''; return; }
  if (!state.data) { count.textContent = t('br_loading'); return; }
  const shown = state.data.recipes.filter(matches);
  count.textContent = t('rc_count', { n: shown.length, total: state.data.recipes.length });
  list.innerHTML = shown.length ? shown.map(card).join('') : `<li class="muted">${esc(t('rc_none'))}</li>`;
}

async function load() {
  try {
    const res = await fetch('/data/nih-recipes.json');
    if (!res.ok) throw new Error('bad response');
    state.data = await res.json();
  } catch {
    state.failed = true;
  }
  paint();
}

let wired = false;
export function initRecipes() {
  if (wired) return;
  wired = true;
  const panel = $('#panel-recipes');
  const byId = (id) => state.data?.recipes.find((r) => r.id === id);
  panel.addEventListener('click', (e) => {
    const f = e.target.closest('[data-recipe-filter]');
    if (f) { state.filter = f.dataset.recipeFilter; paint(); return; }
    const open = e.target.closest('[data-recipe-open]');
    if (open) { const r = byId(open.dataset.recipeOpen); if (r) openRecipe(r); return; }
    const ai = e.target.closest('[data-recipe-ai]');
    if (ai) {
      const r = byId(ai.dataset.recipeAi);
      if (!r) return;
      const dlg = $('[data-recipe-dialog]');
      if (dlg.open) dlg.close();
      $('#tab-ask').click();
      askRecipe(r.title, recipeText(r));
      return;
    }
    if (e.target.closest('[data-recipe-close]')) $('[data-recipe-dialog]').close();
  });
  $('[data-recipe-dialog]').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });
  $('#recipe-q').addEventListener('input', (e) => { state.q = e.target.value.trim(); paint(); });
  load();
}

export function renderRecipes() {
  paint();
}
