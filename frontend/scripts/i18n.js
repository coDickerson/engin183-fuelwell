// Site-wide language: English, Traditional Chinese and Spanish.
// The choice is kept in localStorage so every page opens in the same language,
// and pages re-render in place when it changes (no reload).
//
// Translatable values are either plain strings (same in every language) or
// objects like { en, zh, es }. `tr()` picks the right one.

const KEY = 'fuelwell.lang.v1';
const WAITLIST_KEY = 'fuelwell.waitlist.lang.v1';

export const LANGS = [
  { code: 'en', short: 'EN', name: 'English', html: 'en', intl: 'en-US' },
  { code: 'zh', short: '中文', name: '繁體中文', html: 'zh-Hant', intl: 'zh-Hant-HK' },
  { code: 'es', short: 'ES', name: 'Español', html: 'es', intl: 'es-US' },
];
const CODES = LANGS.map((l) => l.code);

function readStored() {
  try {
    const fromUrl = new URLSearchParams(location.search).get('lang');
    const url = normalise(fromUrl);
    if (url) return url;
    const saved = normalise(localStorage.getItem(KEY));
    if (saved) return saved;
    // Someone who picked a language on the waitlist page keeps it here too.
    return normalise(localStorage.getItem(WAITLIST_KEY)) || 'en';
  } catch {
    return 'en';
  }
}

function normalise(value) {
  if (!value) return null;
  const v = String(value).replace(/^"|"$/g, '').toLowerCase();
  if (v.startsWith('zh')) return 'zh';
  if (v.startsWith('es')) return 'es';
  if (v.startsWith('en')) return 'en';
  return null;
}

let current = readStored();
const listeners = new Set();

export function lang() { return current; }
export function meta(code = current) { return LANGS.find((l) => l.code === code) || LANGS[0]; }
export const intl = () => meta().intl;

export function setLang(code) {
  if (!CODES.includes(code) || code === current) return;
  current = code;
  try { localStorage.setItem(KEY, code); } catch { /* storage unavailable */ }
  document.documentElement.lang = meta().html;
  listeners.forEach((fn) => fn(code));
}

export function onLangChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

/** Pick the current language from a { en, zh, es } value; strings pass through. */
export function tr(value) {
  if (value == null) return '';
  if (typeof value !== 'object') return String(value);
  return value[current] ?? value.en ?? '';
}

/** Look up `key` in a dictionary of { key: { en, zh, es } } and fill {placeholders}. */
export function makeT(dict) {
  return (key, vars) => {
    let text = tr(dict[key]) || key;
    if (vars) text = text.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
    return text;
  };
}

/**
 * Fill static markup: data-i18n (text), data-i18n-html (our own markup),
 * data-i18n-placeholder, data-i18n-aria, data-i18n-alt.
 */
export function applyDom(t, root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  root.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  root.querySelectorAll('[data-i18n-alt]').forEach((el) => { el.alt = t(el.dataset.i18nAlt); });
}

const toggleLabel = { en: 'Language', zh: '語言', es: 'Idioma' };

/** Segmented EN / 中文 / ES control. Returns markup; call wireLangToggle() after inserting it. */
export function langToggleHtml(extraClass = '') {
  return `<div class="lang-toggle ${extraClass}" role="group" aria-label="${toggleLabel[current]}" data-lang-toggle>
    ${LANGS.map((l) => `<button type="button" class="lang-toggle-btn" lang="${l.html}" data-lang="${l.code}" aria-pressed="${l.code === current}" title="${l.name}">${l.short}</button>`).join('')}
  </div>`;
}

const syncedRoots = new WeakSet();

export function wireLangToggle(root = document) {
  root.querySelectorAll('[data-lang-toggle]').forEach((group) => {
    if (group.dataset.wired) return;
    group.dataset.wired = '1';
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-lang]');
      if (btn) setLang(btn.dataset.lang);
    });
  });
  const sync = () => root.querySelectorAll('[data-lang-toggle]').forEach((group) => {
    group.setAttribute('aria-label', toggleLabel[current]);
    group.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === current)));
  });
  if (!syncedRoots.has(root)) { syncedRoots.add(root); onLangChange(sync); }
  sync();
}

document.documentElement.lang = meta().html;
