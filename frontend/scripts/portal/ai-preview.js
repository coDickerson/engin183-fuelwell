// Today: the FuelWell AI box under the greeting. One question box, the last answer on one
// line, and a quiet note that the AI doesn't replace Mei. Asking opens the full AI Chat.
import { esc, icon } from '../app-ui.js';
import { tr } from '../i18n.js';
import { handOffQuestion, lastAiMessage } from './chat-store.js';
import { aiNote } from './ai-note.js';
import { pt } from './strings.js';

export function renderAiPreview(box) {
  const last = lastAiMessage();
  box.innerHTML = `<div class="ai-preview-head">
      <span class="avatar avatar--lg ai-avatar" aria-hidden="true">${icon('sparkle')}</span>
      <div><h2 id="ai-preview-title">${esc(pt('preview_title'))}</h2><p>${esc(pt('preview_sub'))}</p></div>
    </div>
    <form class="preview-form" data-preview-form novalidate>
      <label class="sr-only" for="preview-text">${esc(pt('chat_label'))}</label>
      <input id="preview-text" type="text" maxlength="600" autocomplete="off" placeholder="${esc(pt('preview_placeholder'))}" />
      <button class="button" type="submit">${icon('send')}${esc(pt('preview_ask'))}</button>
    </form>
    <div class="preview-foot">
      ${last ? `<p class="preview-last"><strong>${esc(pt('preview_last'))}</strong> ${esc(tr(last.text).split('\n')[0])}</p>` : ''}
      <a class="link-arrow" href="/ai-chat.html">${esc(pt('preview_open'))} ${icon('arrow')}</a>
    </div>
    ${aiNote({ compact: true })}`;
  // The question travels to AI Chat through session storage, not the address bar.
  box.querySelector('[data-preview-form]').addEventListener('submit', (event) => {
    event.preventDefault();
    const text = box.querySelector('#preview-text').value.trim();
    if (text) handOffQuestion(text);
    location.href = '/ai-chat.html';
  });
}
