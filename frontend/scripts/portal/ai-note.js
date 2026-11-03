// The short "AI doesn't replace your dietitian" note shown wherever FuelWell AI appears.
import { esc, icon } from '../app-ui.js';
import { pt } from './strings.js';

// `compact` is a single quiet line for small spaces such as the Today box.
export function aiNote({ compact = false } = {}) {
  return `<aside class="ai-note${compact ? ' ai-note--compact' : ''}" role="note">
    ${icon('info')}
    <p>${esc(pt(compact ? 'ai_note_short' : 'ai_note'))} <a href="/care-team.html#visits">${esc(pt('ai_note_link'))}</a></p>
  </aside>`;
}
