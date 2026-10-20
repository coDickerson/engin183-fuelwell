import { applyDom } from './i18n.js';
import { t } from './landing-strings.js';

const toggle = document.querySelector('.menu-toggle');
const links = document.querySelector('.nav-links');

const menuLabel = () => t(toggle?.getAttribute('aria-expanded') === 'true' ? 'close_menu' : 'open_menu');

function paint() {
  if (location.pathname === '/' || location.pathname.endsWith('/index.html')) {
    document.title = t('doc_title');
    applyDom(t);
  }
  toggle?.setAttribute('aria-label', menuLabel());
}

paint();

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
