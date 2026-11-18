// Megan's piece on Peyton's Today page: the FuelWell AI box under the greeting.
// dashboard.js calls renderTodayExtras() from its render(), so it follows the language toggle.
import { renderAiPreview } from './ai-preview.js';

export function renderTodayExtras() {
  const preview = document.querySelector('[data-ai-preview]');
  if (preview) renderAiPreview(preview);
}
