// The short "AI doesn't replace your dietitian" note shown wherever FuelWell AI appears.
import { esc, icon } from '../app-ui.js';
import { pt } from './strings.js';

export function aiNote() {
  return `<aside class="ai-note" role="note">
    ${icon('info')}
    <p>${esc(pt('ai_note'))} <a href="/care-team.html#visits">${esc(pt('ai_note_link'))}</a></p>
  </aside>`;
}
