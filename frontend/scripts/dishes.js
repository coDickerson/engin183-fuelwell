import { authConfigError, supabase } from '../auth/supabase.js';

// Permanent public record of the family food board (/dishes). Shows real dishes only:
// seeded samples (sample = true) and anything hidden in the dashboard are left out.

const PAGE = 1000;
const byId = (id) => document.getElementById(id);
const grid = byId('grid');
const status = byId('status');
const search = byId('search');
let dishes = [];

async function loadAll() {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('dish_wall')
      .select('id, created_at, dish, origin')
      .eq('sample', false)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE) return rows;
  }
}

function render() {
  const q = search.value.trim().toLowerCase();
  const shown = q ? dishes.filter((d) => `${d.dish} ${d.origin || ''}`.toLowerCase().includes(q)) : dishes;
  grid.replaceChildren(...shown.map((row) => {
    const li = document.createElement('li');
    li.className = `ds-card ds-card--${row.id % 5}`;
    const dish = document.createElement('strong');
    dish.textContent = row.dish;
    li.append(dish);
    if (row.origin) {
      const origin = document.createElement('span');
      origin.textContent = row.origin;
      li.append(origin);
    }
    return li;
  }));
  status.hidden = shown.length > 0;
  if (!shown.length) status.textContent = q ? `No dishes match “${search.value.trim()}”.` : 'No dishes yet. Be the first to add one.';
}

async function start() {
  if (authConfigError) {
    status.textContent = 'The food board isn’t connected right now. Please try again later.';
    return;
  }
  try {
    dishes = await loadAll();
  } catch {
    status.textContent = 'We couldn’t load the dishes. Check your connection and refresh.';
    return;
  }
  const places = new Set(dishes.map((d) => d.origin?.trim().toLowerCase()).filter(Boolean));
  byId('count').textContent = dishes.length
    ? `${dishes.length} ${dishes.length === 1 ? 'dish' : 'dishes'}${places.size ? ` from ${places.size} ${places.size === 1 ? 'place' : 'places'}` : ''}`
    : '';
  byId('search-wrap').hidden = dishes.length < 8;
  render();
}

search.addEventListener('input', render);
start();
