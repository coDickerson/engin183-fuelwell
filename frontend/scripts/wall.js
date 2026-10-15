import { authConfigError, supabase } from '../auth/supabase.js';

// Live family food board for the projector (/wall). Polls every few seconds; dishes hidden in the
// dashboard (hidden = true) drop off on the next poll. Shows only dish, origin and the
// anonymous yes/no tally; the database doesn't let this page read anything else.

const POLL_MS = 4000;
const MAX = 60;
const byId = (id) => document.getElementById(id);
const grid = byId('grid');
const shown = new Map();
let first = true;

function card(row, fresh) {
  const li = document.createElement('li');
  li.className = `wall-card wall-card--${row.id % 6}${fresh ? ' is-new' : ''}`;
  li.dataset.id = row.id;
  const dish = document.createElement('strong');
  dish.textContent = row.dish;
  li.append(dish);
  if (row.origin) {
    const origin = document.createElement('span');
    origin.textContent = row.origin;
    li.append(origin);
  }
  return li;
}

async function refreshDishes() {
  const [{ data, error }, { count }] = await Promise.all([
    supabase.from('dish_wall').select('id, dish, origin').order('created_at', { ascending: false }).limit(MAX),
    supabase.from('dish_wall').select('id', { count: 'exact', head: true }),
  ]);
  if (error) throw error;
  const ids = new Set(data.map((r) => r.id));
  for (const [id, el] of shown) if (!ids.has(id)) { el.remove(); shown.delete(id); }
  // Newest first; new arrivals pop in at the top-left.
  data.slice().reverse().forEach((row) => {
    if (shown.has(row.id)) return;
    const el = card(row, !first);
    shown.set(row.id, el);
    grid.prepend(el);
  });
  // Keep DOM order matching newest-first after removals.
  data.forEach((row) => grid.append(shown.get(row.id)));
  byId('dish-count').textContent = count ?? data.length;
  byId('empty').hidden = data.length > 0;
  first = false;
}

async function refreshTally() {
  const base = () => supabase.from('class_survey_answers').select('knows_someone', { count: 'exact', head: true });
  const [all, yes] = await Promise.all([base(), base().eq('knows_someone', true)]);
  if (all.error || yes.error || !all.count) return;
  byId('tally').hidden = false;
  byId('tally-pct').textContent = `${Math.round((yes.count / all.count) * 100)}%`;
  byId('tally-text').textContent = `of ${all.count} ${all.count === 1 ? 'person knows' : 'people know'} family or friends with kidney disease`;
}

async function tick() {
  try {
    await Promise.all([refreshDishes(), refreshTally()]);
  } catch (error) {
    console.warn('Wall refresh failed', error);
  }
  setTimeout(tick, POLL_MS);
}

if (authConfigError) byId('empty').textContent = 'The wall isn’t connected. Check the Supabase settings.';
else tick();
