import { applyDom, langToggleHtml, onLangChange, wireLangToggle } from './i18n.js';
import { t } from './landing-strings.js';

const toggle = document.querySelector('.menu-toggle');
const links = document.querySelector('.nav-links');
const slot = document.querySelector('[data-lang-slot]');

const menuLabel = () => t(toggle?.getAttribute('aria-expanded') === 'true' ? 'close_menu' : 'open_menu');

// The other public pages share this script but are English-only for now,
// so only the home page (which has the toggle slot) is translated.
function paint() {
  if (slot) {
    document.title = t('doc_title');
    applyDom(t);
  }
  toggle?.setAttribute('aria-label', menuLabel());
}

if (slot) {
  slot.innerHTML = langToggleHtml();
  wireLangToggle(slot);
}
paint();
onLangChange(paint);

toggle?.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', menuLabel());
  links?.classList.toggle('is-open', open);
});

links?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  toggle?.setAttribute('aria-expanded', 'false');
  toggle?.setAttribute('aria-label', menuLabel());
  links.classList.remove('is-open');
}));
