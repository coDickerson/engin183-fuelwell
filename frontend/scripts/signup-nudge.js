// Gentle "join the waitlist" prompts, shown only in the public demo.
//  - Desktop: a small, quiet card at the bottom of the left rail (always there, never pops up).
//  - Phones: one slim card above the bottom bar, only after the visitor got something useful
//    (an AI answer or a saved swap), at most once per visit, and never again after ✕ or a click.
import { esc, icon } from './app-ui.js';
import { t } from './app-strings.js';
import { isDemoSession, track } from './track.js';

const JOIN_URL = '/join?from=demo';
const SHOWN = 'fuelwell.nudge.shown.v1'; // sessionStorage: already shown this visit
const DONE = 'fuelwell.nudge.done.v1'; // localStorage: clicked join or closed it twice
const CLOSES = 'fuelwell.nudge.closes.v1';

function get(store, key) { try { return window[store].getItem(key); } catch { return null; } }
function set(store, key, value) { try { window[store].setItem(key, value); } catch { /* storage unavailable */ } }

export const joinHref = JOIN_URL;

/** Rail card markup for demo visitors (desktop). */
export function railJoinHtml() {
  return `<div class="demo-join">
    <p class="demo-join-kicker">${esc(t('join_kicker'))}</p>
    <p class="demo-join-text">${esc(t('join_rail_text'))}</p>
    <a class="button button--secondary demo-join-button" href="${JOIN_URL}" data-join-link="rail">${esc(t('join_cta'))}</a>
  </div>`;
}

/** One line under an AI answer in the demo. */
export function inlineJoinHtml() {
  if (!isDemoSession()) return '';
  return `<p class="demo-join-inline">${icon('heart')}<span>${esc(t('join_inline'))} <a href="${JOIN_URL}" data-join-link="answer">${esc(t('join_cta_short'))}</a></span></p>`;
}

// Phones: if they look around for a while without asking or saving, offer it once anyway.
setTimeout(() => offerJoin('time'), 40000);

// Count clicks on any join link (rail, answer line, phone card).
document.addEventListener('click', (e) => {
  const link = e.target.closest('[data-join-link]');
  if (!link) return;
  set('localStorage', DONE, '1');
  track('signup_prompt_click', link.dataset.joinLink);
});

/** Phones only: offer the slim card after a useful moment. */
export function offerJoin(reason) {
  if (!isDemoSession() || !matchMedia('(max-width: 899px)').matches) return;
  if (get('sessionStorage', SHOWN) || get('localStorage', DONE)) return;
  set('sessionStorage', SHOWN, '1');
  // Let them read the answer first.
  setTimeout(() => show(reason), 5000);
}

function show(reason) {
  if (document.querySelector('.join-sheet')) return;
  const el = document.createElement('aside');
  el.className = 'join-sheet';
  el.setAttribute('aria-label', t('join_kicker'));
  el.innerHTML = `<button class="join-sheet-close" type="button" aria-label="${esc(t('join_close'))}">✕</button>
    <p class="join-sheet-title">${esc(t('join_title'))}</p>
    <p class="join-sheet-text">${esc(t('join_text'))}</p>
    <a class="button join-sheet-button" href="${JOIN_URL}" data-join-link="sheet">${esc(t('join_cta'))}</a>`;
  document.body.append(el);
  requestAnimationFrame(() => el.classList.add('is-visible'));
  track('signup_prompt_shown', reason);
  el.querySelector('.join-sheet-close').addEventListener('click', () => {
    const closes = Number(get('localStorage', CLOSES) || 0) + 1;
    set('localStorage', CLOSES, String(closes));
    if (closes >= 2) set('localStorage', DONE, '1');
    track('signup_prompt_dismiss', reason);
    el.classList.remove('is-visible');
    setTimeout(() => el.remove(), 250);
  });
}
