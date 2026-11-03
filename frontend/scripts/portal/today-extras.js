// Megan's pieces on Peyton's Today page: the zone bar and the FuelWell AI preview.
// dashboard.js calls renderTodayExtras() from its render(), so both follow the language toggle.
import { renderZoneBar } from './zone-bar.js';
import { renderAiPreview } from './ai-preview.js';

export function renderTodayExtras() {
  const zone = document.querySelector('[data-zone-bar]');
  const preview = document.querySelector('[data-ai-preview]');
  if (zone) renderZoneBar(zone);
  if (preview) renderAiPreview(preview);
}
