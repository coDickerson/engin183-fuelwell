// Swaps saved from Meals > Browse swaps (the ♡ button). Shown in Notes as "Saved swap" notes.
// Kept in this browser (localStorage), like the grocery checklist.
import { storage } from './app-ui.js';

const KEY = 'fuelwell.saved-swaps.v1';
const store = storage('local');

/** [{ id, meal, swap, why, watch, eater_type, cuisine, savedAt }], newest first. */
export const savedSwaps = () => store.get(KEY, []);
export const isSwapSaved = (id) => savedSwaps().some((s) => s.id === id);

/** Save or unsave a catalog row. Returns true when it is now saved. */
export function toggleSwap(row) {
  const list = savedSwaps();
  if (list.some((s) => s.id === row.id)) {
    store.set(KEY, list.filter((s) => s.id !== row.id));
    return false;
  }
  const { id, meal, swap, why, watch, eater_type, cuisine } = row;
  store.set(KEY, [{ id, meal, swap, why, watch, eater_type, cuisine, savedAt: new Date().toISOString() }, ...list]);
  return true;
}

export function removeSwap(id) {
  store.set(KEY, savedSwaps().filter((s) => s.id !== id));
}
