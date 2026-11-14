// Today: the FuelWell AI box under the greeting. One question box, the last answer on one
// and a quiet note that the AI doesn't replace Mei. Asking opens Meals > Swap a meal with it filled in.
import { esc, icon } from '../app-ui.js';
import { aiNote } from './ai-note.js';
import { pt } from './strings.js';

export function renderAiPreview(box) {
  box.innerHTML = `<div class="ai-preview-head">
      <span class="avatar avatar--lg ai-avatar" aria-hidden="true">${icon('sparkle')}</span>
      <div><h2 id="ai-preview-title">${esc(pt('preview_title'))}</h2><p>${esc(pt('preview_sub'))}</p></div>
    </div>
    <form class="preview-form" data-preview-form novalidate>
      <label class="sr-only" for="preview-text">${esc(pt('preview_label'))}</label>
      <input id="preview-text" type="text" maxlength="300" autocomplete="off" placeholder="${esc(pt('preview_placeholder'))}" />
      <button class="button" type="submit">${icon('send')}${esc(pt('preview_ask'))}</button>
    </form>
    <div class="preview-foot">
      <a class="link-arrow" href="/meals.html#ask">${esc(pt('preview_open'))} ${icon('arrow')}</a>
    </div>
    ${aiNote({ compact: true })}`;
  box.querySelector('[data-preview-form]').addEventListener('submit', (event) => {
    event.preventDefault();
    const text = box.querySelector('#preview-text').value.trim();
    if (text) sessionStorage.setItem('fuelwell.ask.meal', text.slice(0, 300));
    location.href = '/meals.html#ask';
  });
}
