// Draws the result card for each mode, plus the plain-text "Copy for family" version.
// Everything from the AI is inserted as text (esc), never as HTML.
const DISCLAIMER = 'FuelWell student prototype. Not medical advice. Check with your dietitian or care team.';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const VERDICT = { good_pick: 'Already a good pick', tweak: 'Keep it, tweak it', swap: 'Try a swap' };
export const NUTRIENT = { Na: 'sodium', K: 'potassium', P: 'phosphorus', Fluid: 'fluid', Sugar: 'sugar' };

export const KIND = { takeout: 'Fast food', frozen: 'Frozen/microwave', home: 'Home cooked' };
const CATALOG_SOURCE = 'FuelWell swap catalog (draft, pending renal dietitian review)';

/** A catalog row shown as a card, before any AI. */
export function catalogResult(row) {
  return { mode: 'catalog', card: row, sources: [{ id: row.id, kind: 'catalog', title: CATALOG_SOURCE, url: null }], _key: `catalog:${row.id}` };
}

/** "Chinese-American" -> "Chinese", "Filipino / Hawaiian" -> "Filipino"; "Any" fits every cuisine. */
export const cuisineGroup = (c) => String(c || '').split(/\s*[/-]\s*/)[0].replace(/\s+fast food$/i, '').trim();

export function badges(watch) {
  return (watch || []).map((n) => `<span class="badge ${esc(n)}">${esc(n === 'Fluid' || n === 'Sugar' ? n : `${n} · ${NUTRIENT[n] || n}`)}</span>`).join('');
}

function catalogBody(result) {
  const r = result.card;
  const cuisine = cuisineGroup(r.cuisine);
  const watch = badges(r.watch);
  return `
    <div class="card-top">
      <span class="pill tweak">From the swap list</span>
      <h2>${esc(r.meal)}</h2>
      <p class="note">${esc(KIND[r.eater_type] || r.eater_type)}${cuisine && cuisine !== 'Any' ? ` · ${esc(cuisine)}` : ''}</p>
    </div>
    <div class="instead">
      <div><span class="lbl">Instead of</span><p>${esc(r.meal)}</p></div>
      <span class="down" aria-hidden="true">↓</span>
      <div class="try-box"><span class="lbl">Try</span><p>${esc(r.swap)}</p></div>
    </div>
    <p class="headline"><strong>Why:</strong> ${esc(r.why)}</p>
    ${watch ? `<div><h3 class="section-title">What to watch</h3><div class="badges">${watch}</div></div>` : ''}`;
}

function sourcesLine(result) {
  const list = result.sources || [];
  if (!list.length) return '<p class="sources">Sources: general kidney-diet tips (no specific source matched).</p>';
  const items = list.map((s) => (s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a>` : esc(s.title)));
  return `<p class="sources"><strong>Sources:</strong> ${items.join(' · ')}</p>`;
}

function coverageNote(result) {
  if (result.coverage === 'guidelines' && result.mode !== 'recipe') {
    return '<p class="note">This one isn’t in our swap catalog yet, so these tips come from kidney-diet guidelines.</p>';
  }
  return '';
}

function headsUp(card) {
  return card.heads_up ? `<div class="headsup"><strong>Heads up</strong>${esc(card.heads_up)}</div>` : '';
}

function swapBody(result) {
  const c = result.card;
  const tiles = (c.watch || []).map((w) => `
    <div class="tile ${esc(w.nutrient)}">
      <div class="tile-sym" aria-hidden="true">${esc(w.nutrient)}${['Na', 'K', 'P'].includes(w.nutrient) ? `<small>${esc(NUTRIENT[w.nutrient])}</small>` : ''}</div>
      <p><span class="sr-only">${esc(NUTRIENT[w.nutrient] || w.nutrient)}: </span>${esc(w.note)}</p>
    </div>`).join('');
  const swaps = (c.swaps || []).map((s) => `
    <li><strong>${esc(s.title)}</strong><p>${esc(s.how)}</p><p class="why">${esc(s.why)}</p></li>`).join('');
  return `
    <div class="card-top">
      <span class="pill ${esc(c.verdict)}">${esc(VERDICT[c.verdict] || '')}</span>
      <h2>${esc(c.dish)}</h2>
      ${result.photo_dish ? `<p class="note">From your photo: ${esc(result.photo_dish)}</p>` : ''}
      ${c.answer ? `<p class="headline"><strong>${esc(c.answer)}</strong></p>` : ''}
      <p class="headline">${esc(c.headline)}</p>
      ${coverageNote(result)}
    </div>
    ${tiles ? `<div><h3 class="section-title">What to watch</h3><div class="tiles">${tiles}</div></div>` : ''}
    ${swaps ? `<div><h3 class="section-title">Swaps and add-ons</h3><ul class="items">${swaps}</ul></div>` : ''}
    <div class="tonight"><strong>Tonight:</strong> ${esc(c.tonight)}</div>
    ${headsUp(c)}`;
}

function eatoutBody(result) {
  const c = result.card;
  const picks = (c.picks || []).map((p) => `
    <li><strong>${esc(p.item)}</strong><p class="say">Say: “${esc(p.say)}”</p><p class="why">${esc(p.why)}</p></li>`).join('');
  return `
    <div class="card-top">
      <h2>${esc(c.restaurant)}</h2>
      ${coverageNote(result)}
    </div>
    <div><h3 class="section-title">Your 3 picks</h3><ul class="items">${picks}</ul></div>
    ${c.skip ? `<div><h3 class="section-title">Skip this one</h3><ul class="items"><li><strong>${esc(c.skip.item)}</strong><p class="why">${esc(c.skip.why)}</p></li></ul></div>` : ''}
    <div class="tonight"><strong>Tip:</strong> ${esc(c.tip)}</div>
    ${headsUp(c)}`;
}

function recipeBody(result) {
  const c = result.card;
  const changes = (c.changes || []).map((x) => `
    <li class="change"><strong>${esc(x.from)} <span class="arrow" aria-label="becomes">→</span> ${esc(x.to)}</strong><p class="why">${esc(x.why)}</p></li>`).join('');
  const list = (arr, ordered) => (arr?.length ? `<${ordered ? 'ol' : 'ul'} class="plain-list">${arr.map((x) => `<li>${esc(x)}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>` : '');
  return `
    <div class="card-top">
      <h2>${esc(c.title)}</h2>
      <p class="headline">${esc(c.intro)}</p>
    </div>
    ${changes ? `<div><h3 class="section-title">What changed</h3><ul class="items">${changes}</ul></div>` : ''}
    ${c.ingredients?.length ? `<div><h3 class="section-title">Ingredients</h3>${list(c.ingredients)}</div>` : ''}
    ${c.steps?.length ? `<div><h3 class="section-title">Steps</h3>${list(c.steps, true)}</div>` : ''}
    ${c.keep_flavor?.length ? `<div class="tonight"><strong>Keep the flavor</strong>${list(c.keep_flavor)}</div>` : ''}
    ${headsUp(c)}`;
}

const BODY = { swap: swapBody, eatout: eatoutBody, recipe: recipeBody, catalog: catalogBody };

export function renderCard(result, { saved, onSave, onCopy, onPersonalize, hasProfile, onOpenProfile }) {
  const el = document.createElement('article');
  el.className = 'card';
  const body = (BODY[result.mode] || swapBody)(result);
  const personalize = result.mode === 'catalog' && onPersonalize ? `
    <div class="personalize">
      <button type="button" class="primary" data-personalize>Personalize for me</button>
      <p class="hint">${hasProfile ? 'Uses your profile to tailor these swaps.' : 'Gives general tips. <button type="button" data-set-profile>Add your profile</button> for tips that fit you.'}</p>
    </div>` : '';
  el.innerHTML = `
    ${body}
    ${personalize}
    ${sourcesLine(result)}
    <div class="card-actions">
      <button type="button" data-save aria-pressed="${saved}">${saved ? 'Saved ✓' : 'Save'}</button>
      <button type="button" data-copy>Copy for family</button>
    </div>
    <p class="disclaimer">${esc(DISCLAIMER)}</p>`;
  const save = el.querySelector('[data-save]');
  save.addEventListener('click', () => onSave(save));
  el.querySelector('[data-copy]').addEventListener('click', onCopy);
  el.querySelector('[data-personalize]')?.addEventListener('click', onPersonalize);
  el.querySelector('[data-set-profile]')?.addEventListener('click', onOpenProfile);
  return el;
}

export function renderError(message) {
  const el = document.createElement('div');
  el.className = 'error-card';
  el.setAttribute('role', 'alert');
  el.innerHTML = `<p>${esc(message)}</p>`;
  return el;
}

/** Plain text for texting a family member. */
export function cardText(result) {
  const c = result.card || {};
  const lines = [];
  if (result.mode === 'catalog') {
    lines.push(c.meal, '', `Instead of: ${c.meal}`, `Try: ${c.swap}`, `Why: ${c.why}`);
    if (c.watch?.length) lines.push('', `What to watch: ${c.watch.map((n) => NUTRIENT[n] || n).join(', ')}`);
  } else if (result.mode === 'swap') {
    lines.push(`${c.dish} (${VERDICT[c.verdict] || ''})`, ...(c.answer ? [c.answer] : []), c.headline, '');
    if (c.watch?.length) lines.push('What to watch:', ...c.watch.map((w) => `- ${NUTRIENT[w.nutrient] || w.nutrient}: ${w.note}`), '');
    if (c.swaps?.length) lines.push('Swaps:', ...c.swaps.map((s) => `- ${s.title}: ${s.how} (${s.why})`), '');
    lines.push(`Tonight: ${c.tonight}`);
  } else if (result.mode === 'eatout') {
    lines.push(`Eating out: ${c.restaurant}`, '', 'Picks:');
    for (const p of c.picks || []) lines.push(`- ${p.item}. Say: "${p.say}" (${p.why})`);
    if (c.skip) lines.push('', `Skip: ${c.skip.item} (${c.skip.why})`);
    lines.push('', `Tip: ${c.tip}`);
  } else {
    lines.push(c.title, c.intro, '');
    if (c.changes?.length) lines.push('What changed:', ...c.changes.map((x) => `- ${x.from} -> ${x.to} (${x.why})`), '');
    if (c.ingredients?.length) lines.push('Ingredients:', ...c.ingredients.map((x) => `- ${x}`), '');
    if (c.steps?.length) lines.push('Steps:', ...c.steps.map((x, i) => `${i + 1}. ${x}`), '');
    if (c.keep_flavor?.length) lines.push('Keep the flavor:', ...c.keep_flavor.map((x) => `- ${x}`));
  }
  if (c.heads_up) lines.push('', `Heads up: ${c.heads_up}`);
  if (result.sources?.length) lines.push('', `Sources: ${result.sources.map((s) => s.title).join('; ')}`);
  lines.push('', DISCLAIMER);
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
