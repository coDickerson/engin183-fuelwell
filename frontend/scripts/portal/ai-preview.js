// Today: a small FuelWell AI preview with the last answer and a box that opens the full chat.
import { esc, icon } from '../app-ui.js';
import { tr } from '../i18n.js';
import { handOffQuestion, lastAiMessage } from './chat-store.js';
import { aiNote } from './ai-note.js';
import { pt } from './strings.js';

const MAX_PREVIEW = 140;

function previewText(message) {
  const text = tr(message.text).split('\n')[0];
  return text.length > MAX_PREVIEW ? `${text.slice(0, MAX_PREVIEW).trimEnd()}…` : text;
}

export function renderAiPreview(box) {
  const last = lastAiMessage();
  box.innerHTML = `<div class="panel-title"><h2 id="ai-preview-title">${esc(pt('preview_title'))}</h2><span class="source-tag source-tag--ai">${icon('sparkle')}${esc(pt('ai_short'))}</span></div>
    ${last
      ? `<p class="preview-last"><span class="preview-label">${esc(pt('preview_last'))}</span>${esc(previewText(last))}</p>`
      : `<p class="preview-last">${esc(pt('preview_empty'))}</p>`}
    <form class="preview-form" data-preview-form novalidate>
      <label class="sr-only" for="preview-text">${esc(pt('chat_label'))}</label>
      <input id="preview-text" type="text" maxlength="600" autocomplete="off" placeholder="${esc(pt('preview_placeholder'))}" />
      <button class="button" type="submit">${icon('send')}${esc(pt('preview_ask'))}</button>
    </form>
    ${aiNote()}`;
  // The question travels to AI Chat through session storage, not the address bar.
  box.querySelector('[data-preview-form]').addEventListener('submit', (event) => {
    event.preventDefault();
    const text = box.querySelector('#preview-text').value.trim();
    if (text) handOffQuestion(text);
    location.href = '/ai-chat.html';
  });
}
