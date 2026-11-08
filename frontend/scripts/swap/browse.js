// "Browse swaps": cards from FuelWell's swap catalog (GET /api/catalog). No AI call.
// Filter chips by kind of meal and cuisine; tapping a card hands the row to onOpen.
import { badges, cuisineGroup, esc, KIND } from './card.js';

export function initBrowse({ onOpen }) {
  const typeBox = document.querySelector('[data-browse-type]');
  const cuisineBox = document.querySelector('[data-browse-cuisine]');
  const grid = document.querySelector('[data-browse-grid]');
  const count = document.querySelector('[data-browse-count]');
  const filter = { kind: 'all', cuisine: 'all' };
  let rows = [];

  function chips(box, options, key) {
    box.innerHTML = '';
    for (const [value, label] of options) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.setAttribute('aria-pressed', String(filter[key] === value));
      b.addEventListener('click', () => {
        filter[key] = value;
        for (const x of box.children) x.setAttribute('aria-pressed', String(x === b));
        draw();
      });
      box.append(b);
    }
  }

  function draw() {
    const shown = rows.filter((r) =>
      (filter.kind === 'all' || r.eater_type === filter.kind) &&
      (filter.cuisine === 'all' || cuisineGroup(r.cuisine) === filter.cuisine));
    count.textContent = `${shown.length} ${shown.length === 1 ? 'swap' : 'swaps'}`;
    grid.innerHTML = '';
    if (!shown.length) {
      grid.innerHTML = '<li class="browse-empty">No swaps for that mix yet. Try “All”.</li>';
      return;
    }
    for (const r of shown) {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'browse-card';
      const cuisine = cuisineGroup(r.cuisine);
      b.innerHTML = `
        <span class="meal">${esc(r.meal)}</span>
        <span class="meta">${esc(KIND[r.eater_type] || r.eater_type)}${cuisine && cuisine !== 'Any' ? ` · ${esc(cuisine)}` : ''}</span>
        <span class="try"><b>Try:</b> ${esc(r.swap)}</span>
        <span class="badges" aria-label="What to watch">${badges(r.watch)}</span>`;
      b.addEventListener('click', () => onOpen(r));
      li.append(b);
      grid.append(li);
    }
  }

  async function load() {
    count.textContent = 'Loading swaps…';
    try {
      const res = await fetch('/api/catalog');
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.rows)) throw new Error(data?.error || 'bad response');
      rows = data.rows;
    } catch {
      count.textContent = "Couldn't load swaps just now. Refresh to try again.";
      return;
    }
    chips(typeBox, [['all', 'All'], ...Object.entries(KIND)], 'kind');
    const cuisines = [...new Set(rows.map((r) => cuisineGroup(r.cuisine)).filter((c) => c && c !== 'Any'))].sort();
    chips(cuisineBox, [['all', 'All cuisines'], ...cuisines.map((c) => [c, c])], 'cuisine');
    draw();
  }

  load();
}
