// Appointments → Messages: a slim line that says Mei is a real person, not the AI,
// with a pointer to Meals > Swap a meal for quick food ideas.
import { esc, icon } from '../app-ui.js';
import { persona } from '../../data/fung.js';
import { pt } from './strings.js';

export function renderCareSplit() {
  const box = document.querySelector('[data-care-split]');
  if (!box) return;
  box.innerHTML = `${icon('users')}
    <p><strong>${esc(pt('split_real', { name: persona.dietitian.name }))}</strong> ${esc(pt('split_not_ai'))}
    <a href="/meals.html#ask">${esc(pt('split_ai_link'))}</a></p>`;
}
