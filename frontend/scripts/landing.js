import { applyDom, langToggleHtml, onLangChange, wireLangToggle } from './i18n.js';
import { t } from './landing-strings.js';

const toggle = document.querySelector('.menu-toggle');
const links = document.querySelector('.nav-links');
const slot = document.querySelector('[data-lang-slot]');
const highlight = document.querySelector('[data-hero-highlight]');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
let highlightIndex = 0;

const menuLabel = () => t(toggle?.getAttribute('aria-expanded') === 'true' ? 'close_menu' : 'open_menu');

function highlightWords() { return t('hero_highlights').split('|'); }
function paintHighlight() {
  if (highlight) highlight.textContent = highlightWords()[highlightIndex] || highlightWords()[0];
}

function paint() {
  if (slot) {
    if (highlight) document.title = t('doc_title');
    applyDom(t);
    paintHighlight();
  }
  toggle?.setAttribute('aria-label', menuLabel());
}

if (slot) {
  slot.innerHTML = langToggleHtml();
  wireLangToggle(slot);
}
paint();
onLangChange(paint);

if (highlight && !reduceMotion.matches) {
  window.setInterval(() => {
    highlight.classList.add('is-changing');
    window.setTimeout(() => {
      highlightIndex = (highlightIndex + 1) % highlightWords().length;
      paintHighlight();
      highlight.classList.remove('is-changing');
    }, 200);
  }, 3600);
}

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

// Fade sections in as they scroll into view. Content stays visible without JS,
// and people who ask for reduced motion get no animation.
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const targets = document.querySelectorAll('main .section-heading, main .card, main .explore-card, main .closing-inner, main .faq-list, main .experts-card');
  const io = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-in');
    io.unobserve(entry.target);
  }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  targets.forEach((el) => { el.classList.add('reveal'); io.observe(el); });
  document.documentElement.classList.add('js-reveal');
}
